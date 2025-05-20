import json

from flask import Flask, request, jsonify, session
from functools import wraps

from backend.RSDB_kv_service import get_kv
from backend.error import ErrorCode
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
    return


@app.route('/delete', methods=['DELETE'])
@login_required
def delete_route():
    return


@app.route('/upload', methods=['POST'])
@login_required
def upload_route():
    return


@app.route('/share', methods=['POST'])
@login_required
def share_route():
    return


@app.route('/logout', methods=['POST'])
@login_required
def logout_route():
    return


if __name__ == '__main__':
    app.run(debug=True)
