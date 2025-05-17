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
