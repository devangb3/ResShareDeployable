import hashlib
import json
from uu import Error
from io import BytesIO

from flask import Flask, request, jsonify, session, send_file
from functools import wraps
from flask_cors import CORS

from backend.RSDB_kv_service import get_kv, set_kv
from backend.error import ErrorCode
from backend.ipfs import add_file_to_cluster, download_file_from_ipfs
from backend.node import Node
from backend.share_manager import ShareManager
from backend.user_authentication_service import login, sign_up
from backend.file import File

FILE_SIZE_LIMIT = 500 * 1024 * 1024
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:5997'])
app.secret_key = "e9fdf1d445d445bb7d12df76043e3b74617cf78934a99353efb3a7eb826dfb01"

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return jsonify({'message': ErrorCode.NOT_LOGGED_IN}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/login', methods=['POST'])
def login_route():
    data = request.get_json()
    username = data['username']
    password = data['password']

    result = login(username, password)

    if result == ErrorCode.SUCCESS:
        session['username'] = username
        root_json = get_kv(username + " ROOT")
        root_json = json.loads(root_json)
        share_list = get_kv(username + " SHARE_MANAGER")
        share_list = json.loads(share_list)
        return jsonify({
            'result': result.name,
            'root': root_json,
            'share_list': share_list
        }), 200

    return jsonify({'result': result.name}), 401

@app.route('/signup', methods=['POST'])
def signup_route():
    data = request.get_json()
    username = data['username']
    password = data['password']
    result = sign_up(username, password)
    if result == ErrorCode.SUCCESS:
        return jsonify({
            'result': result.name
        }), 200

    return jsonify({'result': result.name}), 401

@app.route('/create-folder', methods=['POST'])
@login_required
def create_folder_route():
    data = request.get_json()
    if 'folder_path' not in data:
        return jsonify({'result': ErrorCode.INVALID_REQUEST.name}), 400
    folder_path = data.get('folder_path')
    username = session['username']

    if not folder_path or folder_path.strip("/") == "":
        return jsonify({'result': ErrorCode.INVALID_PATH.name}), 400

    parts = folder_path.strip("/").split("/")
    folder_name = parts[-1]
    parent_path = "/".join(parts[:-1])

    root = Node.from_json(get_kv(username + " ROOT"))

    parent_node = root.find_node_by_path(parent_path) if parent_path else root
    if parent_node is None or not parent_node.is_folder:
        return jsonify({'result': ErrorCode.INVALID_PATH.name}), 400

    if folder_name in parent_node.children:
        return jsonify({'result': ErrorCode.DUPLICATE_NAME.name}), 409

    new_folder = Node(name=folder_name, is_folder=True)
    parent_node.add_child(new_folder)

    set_kv(username + " ROOT", root.to_json())

    return jsonify({'result': ErrorCode.SUCCESS.name,
                    'root': root.to_json()}), 201


@app.route('/delete', methods=['DELETE'])
@login_required
def delete_route():
    data = request.get_json()
    if 'node_path' not in data:
        return jsonify({'message': ErrorCode.INVALID_REQUEST.name}), 400

    if 'delete_in_root' not in data:
        return jsonify({'message': ErrorCode.INVALID_REQUEST}), 400
    node_path = data['node_path']
    username = session['username']
    is_root = data['delete_in_root']
    if isinstance(is_root, str):
        is_root = is_root.lower() == 'true'

    if is_root:
        root = Node.from_json(get_kv(username + " ROOT"))

        if node_path.strip("/") == "":
            return jsonify({'message': ErrorCode.DELETE_ROOT_DIRECTORY.name}), 400

        parts = node_path.strip("/").split("/")
        node_name = parts[-1]
        parent_path = "/".join(parts[:-1])

        parent_node = root.find_node_by_path(parent_path) if parent_path else root

        if parent_node is None or not parent_node.is_folder:
            return jsonify({'message': ErrorCode.INVALID_PATH.name}), 400

        if node_name not in parent_node.children:
            return jsonify({'message': ErrorCode.NODE_NOT_FOUND.name}), 404

        del parent_node.children[node_name]

        set_kv(username + " ROOT", root.to_json())

        return jsonify({'message': ErrorCode.SUCCESS.name,
                        'root': root.to_json()}), 200
    else:
        share_json = get_kv(username + " SHARE_MANAGER")
        share_manager = ShareManager.from_json(share_json)

        target_node = share_manager.find_node_by_path(node_path)
        if target_node is None:
            return jsonify({'message': ErrorCode.NODE_NOT_FOUND.name}), 404

        from_user = node_path.strip("/").split("/")[0]

        result = share_manager.delete(from_user, target_node)
        set_kv(username + " SHARE_MANAGER", share_manager.to_json())

        return jsonify({'message': result.name,
                        'root': share_manager.to_json()}), 200





@app.route('/share', methods=['POST'])
@login_required
def share_route():
    data = request.get_json()
    if 'target' not in data or 'node' not in data:
        return jsonify({'message': ErrorCode.INVALID_REQUEST.name}), 400
    username = session['username']
    target_username = data['target']
    node = data['node']
    try:
        node = Node.from_json(node)
    except json.JSONDecodeError:
        return jsonify({'message': "Failed to parse the JSON"}), 400
    if node.name == "root":
        return jsonify({'message': ErrorCode.SHARE_ROOT.name}), 400

    target_sm = get_kv(target_username + " SHARE_MANAGER")
    if target_sm == "\n" or target_sm == "" or target_sm == " ":
        return jsonify({'message': ErrorCode.INVALID_USERNAME.name}), 400

    target_sm = ShareManager.from_json(target_sm)
    result = target_sm.receive(username, node)
    if result != ErrorCode.SUCCESS:
        return jsonify({'message': result.name}), 400

    set_kv(target_username + " SHARE_MANAGER", target_sm.to_json())

    return jsonify({'message': ErrorCode.SUCCESS.name}), 200


@app.route('/delete-user', methods=['DELETE'])
@login_required
def delete_user_route():
    data = request.get_json()
    username = session['username']
    password = data['password']
    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    if hashed_password != get_kv(username):
        return jsonify({'message': ErrorCode.INCORRECT_PASSWORD.name}), 401

    set_kv(username, "\n")
    set_kv(username + " ROOT", "\n")
    set_kv(username + " SHARE_MANAGER", "\n")

    session.pop(username)

    return jsonify({'message': ErrorCode.SUCCESS.name}), 200

@app.route('/logout', methods=['POST'])
@login_required
def logout_route():
    session.pop('username', None)
    return jsonify({'message': ErrorCode.SUCCESS}), 200


@app.route('/upload', methods=['POST'])
@login_required
def upload_route():
    """
    if user want to upload example.txt to path root/doc/example.txt. The path part in request should be root/doc
    """
    if 'file' not in request.files:
        return jsonify({'message': ErrorCode.INVALID_REQUEST.name}), 400

    if 'path' not in request.form:
        return jsonify({'message': ErrorCode.INVALID_REQUEST.name}), 400

    path = request.form['path']
    username = session['username']
    file = request.files['file']

    if file.filename == '':
        return jsonify({'message': ErrorCode.INVALID_REQUEST.name}), 400

    filename = file.filename
    file_stream = BytesIO(file.read())

    file_size = file_stream.getbuffer().nbytes

    if file_size > FILE_SIZE_LIMIT:
        return jsonify({'message': ErrorCode.EXCEED_MAX_FILE_SIZE.name}), 413

    cid = add_file_to_cluster(file_stream, filename)

    if cid is None:
        return jsonify({'message': ErrorCode.IPFS_ERROR.name}), 500

    root = Node.from_json(get_kv(username + " ROOT"))
    target_node = root.find_node_by_path(path)

    if target_node is None:
        return jsonify({'message': ErrorCode.NODE_NOT_FOUND.name}), 404

    result = target_node.add_child(Node(filename, False, file_obj=File(cid, file_size, filename)))

    if result != ErrorCode.SUCCESS:
        return jsonify({'message': result.name}), 400

    set_kv(username + " ROOT", root.to_json())

    return jsonify({'message': ErrorCode.SUCCESS.name, 'root': root.to_json()}), 200



@app.route('/download', methods=['POST'])
@login_required
def download_route():
    data = request.get_json()
    if not data or 'path' not in data:
        return jsonify({'message': ErrorCode.INVALID_PATH.name}), 400

    path = data['path']
    username = session['username']

    root = Node.from_json(get_kv(username + " ROOT"))
    target_node = root.find_node_by_path(path)

    if target_node is None or target_node.is_folder:
        return jsonify({'message': ErrorCode.NODE_NOT_FOUND.name}), 404

    file_obj = target_node.file_obj
    if not file_obj:
        return jsonify({'message': ErrorCode.FILE_NOT_FOUND.name}), 404

    file_content = download_file_from_ipfs(file_obj.cid)
    if not file_content or not file_content.get("success"):
        return jsonify({'message': ErrorCode.IPFS_ERROR.name if file_content is None else file_content.get('message', ErrorCode.IPFS_ERROR.name)}), 500
    
    return send_file(
        file_content["file"].getvalue(),
        mimetype='application/octet-stream',
        as_attachment=True,
        download_name=file_obj.filename
    )


if __name__ == '__main__':
    app.run(debug=True)
