import json
from typing import Dict, List

from backend.error import ErrorCode
from backend.node import Node

class ShareManager:
    def __init__(self):
        self.share_list: Dict[str, List[Node]] = {}

    def receive(self, from_username: str, node: Node):
        if from_username not in self.share_list:
            self.share_list[from_username] = []
        if node in self.share_list[from_username]:
            return ErrorCode.ALREADY_SHARED
        self.share_list[from_username].append(node)
        return ErrorCode.SUCCESS

    def to_dict(self):
        return {
            from_user: [node.to_dict() for node in node_list]
            for from_user, node_list in self.share_list.items()
        }

    @classmethod
    def from_dict(cls, data):
        sm = cls()
        for from_user, node_dict_list in data.items():
            sm.share_list[from_user] = [Node.from_dict(nd) for nd in node_dict_list]
        return sm

    def to_json(self):
        return json.dumps(self.to_dict(), indent=2)

    @classmethod
    def from_json(cls, json_str):
        return cls.from_dict(json.loads(json_str))
