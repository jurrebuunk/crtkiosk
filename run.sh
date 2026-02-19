#!/run/current-system/sw/bin/bash
cd /home/jurre/repos/crtkiosk
exec nix-shell -p python3Packages.flask --run "python3 app.py"