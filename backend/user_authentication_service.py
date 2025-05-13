import hashlib

from backend.share_manager import ShareManager
from backend.util import is_valid_password, is_valid_username
from error import ErrorCode
from RSDB_kv_service import get_kv, set_kv
from node import Node

def sign_up(username, password):
    res = get_kv(username)
    if res != "\n" and res != " " and res != "":
        return ErrorCode.USER_EXISTS

    if not is_valid_username(username):
        return ErrorCode.INVALID_USERNAME

    if not is_valid_password(password):
        return ErrorCode.INVALID_PASSWORD

    hashed_password_str = hashlib.sha256(password.encode()).hexdigest()

    root_str = Node("root", True).to_json()
    sm_str = ShareManager().to_json()

    set_kv(username, hashed_password_str)
    set_kv(username + " ROOT", root_str)
    set_kv(username + "SHARE_MANAGER", sm_str)

    return ErrorCode.SUCCESS

def login(username, password):
    hashed_password_from_rsdb = get_kv(username)
    if hashed_password_from_rsdb != "\n" and hashed_password_from_rsdb != " " and hashed_password_from_rsdb != "":
        return ErrorCode.USER_NOT_FOUND

    hashed_password_from_user = hashlib.sha256(password.encode()).hexdigest()

    if hashed_password_from_rsdb != hashed_password_from_user:
        return ErrorCode.INCORRECT_PASSWORD

    desensitized_root = Node.from_json(get_kv(username + " ROOT")).to_desensitized_json()
    desensitized_sm = ShareManager.from_json(get_kv(username + " SHARE_MANAGER")).to_desensitized_json()

    return [username, desensitized_root, desensitized_sm]

