from graphify.detect import detect
from unittest.mock import patch
import os

original_walk = os.walk
def hooked_walk(top, **kwargs):
    print(f"walk called with {top}")
    for dirpath, dirnames, filenames in original_walk(top, **kwargs):
        print(f"visiting {dirpath}, dirs={len(dirnames)}, files={len(filenames)}")
        yield dirpath, dirnames, filenames

with patch('os.walk', hooked_walk):
    from pathlib import Path
    res = detect(Path('.'))
    print(res['total_files'])
