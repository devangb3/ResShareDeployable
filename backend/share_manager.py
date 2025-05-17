from datetime import datetime
from backend.node import Node
from backend.file import File

class Received:
    def __init__(self, node, shared_by, received_at=None):
        self.node = node
        self.shared_by = shared_by
        self.received_at = received_at or datetime.now()

    def __repr__(self):
        return f"Shared by {self.shared_by} at {self.received_at}: {self.node}"

class ShareManager:
    def __init__(self, owner):
        self.owner = owner
        self.sent = {}      # to_user -> list of shared Node
        self.received = {}  # from_user -> list of Received

    def share(self, to_user, node):
        """
        Share a node (file or folder) to another user.
        This does not remove the node from current user.
        """
        # Deep copy the node to avoid shared state issues
        import copy
        node_copy = copy.deepcopy(node)

        # Add to sent list
        if to_user not in self.sent:
            self.sent[to_user] = []
        self.sent[to_user].append(node_copy)

        # Simulate sending to other user's manager
        # In a real system, you'd call the actual receiver's receive method
        return to_user, node_copy

    def receive(self, from_user, node):
        """
        Receive a node shared by another user.
        """
        received_item = Received(node=node, shared_by=from_user)
        if from_user not in self.received:
            self.received[from_user] = []
        self.received[from_user].append(received_item)
