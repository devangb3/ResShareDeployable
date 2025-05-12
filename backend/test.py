import sys, os
from node import Node
from file import File


root = Node("root", True)
doc_node = Node("doc", True)
root.add_child(doc_node)

file_obj = File(cid="QmABC123", size=1024, filename="example.txt")

file_node = Node("example.txt", is_folder=False, file_obj=file_obj)

doc_node.add_child(file_node)

doc_path = root.find_node_by_path("doc/")

print((doc_path.to_json()))







