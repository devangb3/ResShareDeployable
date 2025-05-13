from datetime import datetime
from backend.node import Node

class Sent:
    def __init__(self, node, shared_with, shared_at=None):
        self.node = node
        self.shared_with = shared_with
        self.shared_at = shared_at or datetime.now()

    # TODO

class Received:
    def __init__(self, node, shared_by, received_at=None):
        self.node = node
        self.shared_by = shared_by
        self.received_at = received_at or datetime.now()

    # TODO

import json

class ShareManager:
    def __init__(self):
        self.sent_store = {}       # username -> list of Sent
        self.received_store = {}   # username -> list of Received

    # TODO
