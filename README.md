cd frontend

npm install

cd ../backend

python3.13 -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt 

cd ../frontend

npm run start