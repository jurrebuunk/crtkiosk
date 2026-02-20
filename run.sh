#!/run/current-system/sw/bin/bash
cd /home/jurre/repos/crtkiosk
exec nix-shell -p python3Packages.flask python3Packages.matrix-nio python3Packages.python-dotenv --run "python3 app.py"