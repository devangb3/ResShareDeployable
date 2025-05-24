import hashlib
import json
from uu import Error

from flask import Flask, request, jsonify, session
from functools import wraps

from backend.RSDB_kv_service import get_kv, set_kv
from backend.error import ErrorCode
from backend.node import Node
from backend.share_manager import ShareManager
from backend.user_authentication_service import login, sign_up
app = Flask(__name__)
app.secret_key = "e9fdf1d445d445bb7d12df76043e3b74617cf78934a99353efb3a7eb826dfb01"

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return jsonify({'error': 'Not logged in'}), 401
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
    node_path = data['node_path']
    username = session['username']

    root = Node.from_json(get_kv(username + " ROOT"))

    if node_path.strip("/") == "":
        return jsonify({'error': ErrorCode.DELETE_ROOT_DIRECTORY}), 400

    parts = node_path.strip("/").split("/")
    node_name = parts[-1]
    parent_path = "/".join(parts[:-1])

    parent_node = root.find_node_by_path(parent_path) if parent_path else root

    if parent_node is None or not parent_node.is_folder:
        return jsonify({'error': ErrorCode.INVALID_PATH}), 400

    if node_name not in parent_node.children:
        return jsonify({'error': ErrorCode.NODE_NOT_FOUND}), 404

    del parent_node.children[node_name]

    set_kv(username + " ROOT", root.to_json())

    return jsonify({'message': ErrorCode.SUCCESS,
                    'root': root.to_json()}), 200


@app.route('/share', methods=['POST'])
@login_required
def share_route():
    data = request.get_json()
    username = session['username']
    target_username = data['target']
    node = data['node']
    node = Node.from_json(node)
    if node.name == "root":
        return jsonify({'message': ErrorCode.SHARE_ROOT})

    target_sm = get_kv(target_username + " SHARE_MANAGER")
    if target_sm == "\n" or target_sm == "" or target_sm == " ":
        return jsonify({'message': ErrorCode.INVALID_USERNAME})

    target_sm = ShareManager.from_json(target_sm)
    result = target_sm.receive(username, node)
    if result != ErrorCode.SUCCESS:
        return jsonify({'message': result})

    set_kv(target_username + " SHARE_MANAGER", target_sm.to_json())

    return jsonify({'message': ErrorCode.SUCCESS})


@app.route('/delete-user', methods=['DELETE'])
@login_required
def delete_user_route():
    data = request.get_json()
    username = session['username']
    password = data['password']
    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    if hashed_password != get_kv(username):
        return jsonify({'message': ErrorCode.INCORRECT_PASSWORD})

    set_kv(username, "\n")
    set_kv(username + " ROOT", "\n")
    set_kv(username + " SHARE_MANAGER", "\n")

    session.pop(username)

    return jsonify({'message': ErrorCode.SUCCESS})

@app.route('/logout', methods=['POST'])
@login_required
def logout_route():
    session.pop('username', None)
    return jsonify({'message': ErrorCode.SUCCESS}), 200


@app.route('/upload', methods=['POST'])
@login_required
def upload_route():
    return


@app.route('/download', methods=['POST'])
@login_required
def download_route():
    return

if __name__ == '__main__':
    app.run(debug=True)
