from datetime import datetime
from backend.node import Node

class Sent:
    def __init__(self, node, shared_with, shared_at=None):
        self.node = node
        self.shared_with = shared_with
        self.shared_at = shared_at or datetime.now()

    def to_dict(self):
        return {
            "node": self.node.to_dict(),
            "shared_with": self.shared_with,
            "shared_at": self.shared_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data):
        node = Node.from_dict(data["node"])
        shared_with = data["shared_with"]
        shared_at = datetime.fromisoformat(data["shared_at"])
        return cls(node, shared_with, shared_at)

    def __repr__(self):
        return f"[SENT] {self.node.name} → {self.shared_with} at {self.shared_at}"


class Received:
    def __init__(self, node, shared_by, received_at=None):
        self.node = node
        self.shared_by = shared_by
        self.received_at = received_at or datetime.now()

    def to_dict(self):
        return {
            "node": self.node.to_dict(),
            "shared_by": self.shared_by,
            "received_at": self.received_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data):
        node = Node.from_dict(data["node"])
        shared_by = data["shared_by"]
        received_at = datetime.fromisoformat(data["received_at"])
        return cls(node, shared_by, received_at)

    def __repr__(self):
        return f"[RECEIVED] {self.node.name} ← {self.shared_by} at {self.received_at}"


import json

class ShareManager:
    def __init__(self):
        self.sent_store = {}       # username -> list of Sent
        self.received_store = {}   # username -> list of Received

    def share(self, to_user: str, node: Node):
        # TODO

    def receive(self, from_user: str, node: Node):
        # TODO
    

    def get_sent(self, username):
        return self.sent_store.get(username, [])

    def get_received(self, username):
        return self.received_store.get(username, [])


    def to_json(self):
        data = {
            "sent_store": {
                user: [s.to_dict() for s in sent_list]
                for user, sent_list in self.sent_store.items()
            },
            "received_store": {
                user: [r.to_dict() for r in received_list]
                for user, received_list in self.received_store.items()
            }
        }
        return json.dumps(data, indent=2)

    @classmethod
    def from_json(cls, json_str):
        obj = cls()
        data = json.loads(json_str)

        for user, sent_list in data["sent_store"].items():
            obj.sent_store[user] = [Sent.from_dict(s) for s in sent_list]

        for user, received_list in data["received_store"].items():
            obj.received_store[user] = [Received.from_dict(r) for r in received_list]

        return obj

    def to_desensitized_json(self, node: Node) -> str:
        return json.dumps(node.to_desensitized_dict(), indent=2)

    def find_shared_node_by_path(self, username: str, path: str):
        parts = path.strip("/").split("/")
        if not parts or parts[0] not in ("sent", "received"):
            raise ValueError("Path must start with 'sent/' or 'received/'")

        direction = parts[0]
        subpath = parts[1:]

        records = self.get_sent(username) if direction == "sent" else self.get_received(username)

        for record in records:
            node = record.node
            current = node
            for part in subpath:
                if not current.is_folder or part not in current.children:
                    current = None
                    break
                current = current.children[part]
            if current:
                return current

        return None

