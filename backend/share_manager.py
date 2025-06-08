import json
from typing import Dict, List

from backend.error import ErrorCode
from backend.node import Node

class ShareManager:
    def __init__(self):
        self.share_list: Dict[str, List[Node]] = {}

    def receive(self, from_username: str, node: Node) -> ErrorCode:
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

    def find_node_by_path(self, path):
        parts = path.strip("/").split("/")
        if len(parts) < 2:
            return None

        from_user = parts[0]
        sub_path = "/".join(parts[1:])

        if from_user not in self.share_list:
            return None

        for root_node in self.share_list[from_user]:
            result = root_node.find_node_by_path(sub_path)
            if result:
                return result

        return None

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

    def delete(self, from_user: str, target_node: Node) -> ErrorCode:
        """
        Deletes a shared node from both the sender and receiver's share lists.
        
        Args:
            from_user: The username of the user who shared the node
            target_node: The node to be deleted
            
        Returns:
            ErrorCode: SUCCESS if deletion was successful, NODE_NOT_FOUND if node wasn't found
        """
        if from_user not in self.share_list:
            return ErrorCode.NODE_NOT_FOUND
            
        # Find and remove the node from the share list
        for i, node in enumerate(self.share_list[from_user]):
            if node.name == target_node.name and node.is_folder == target_node.is_folder:
                self.share_list[from_user].pop(i)
                # If this was the last shared item from this user, remove their entry
                if not self.share_list[from_user]:
                    del self.share_list[from_user]
                return ErrorCode.SUCCESS
                
        return ErrorCode.NODE_NOT_FOUND
