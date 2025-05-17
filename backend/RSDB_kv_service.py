import os
import sys
from backend import pybind_kv
config_path = "config/kv_service.config"



def set_kv(key: str, value: str):
    """
    Get a key from RSDB
    :param key: The target key you want to set (str)
    :param value: The target value you want to set (str)
    :return None
    """
    global config_path
    print(f"SETTING {key}, {value}")
    pybind_kv.set("RESSHARE " + key, value, config_path)


def get_kv(key: str) -> str:
    """
    Get a key from RSDB
    :param key: The target key you want to get (str)
    :return The corresponding value of that key
    """
    global config_path
    print(f"GETTING {key}")
    return pybind_kv.get("RESSHARE " + key, config_path)

# print(set_kv("test", "ttt"))
# print(get_kv("test"))
