from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

app = Flask(__name__)

CORS(app)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY and "your-supabase-url-here" not in SUPABASE_URL:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")

users = {
    "admin": "password123",
    "user1": "pass"
}

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400
            
        if username in users and users[username] == password:
            return jsonify({"message": "Login successful"}), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sales', methods=['GET'])
def get_sales():
    if not supabase:
        return jsonify({"error": "Database not configured. Please add Supabase credentials to .env"}), 500
    try:
        response = supabase.table('sales').select("*").execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sales', methods=['POST'])
def add_sale():
    if not supabase:
        return jsonify({"error": "Database not configured. Please add Supabase credentials to .env"}), 500
    try:
        data = request.json
        if not data or not data.get('product') or not data.get('amount'):
            return jsonify({"error": "Product and amount are required"}), 400
        
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400
        
        new_sale = {
            "product": data['product'],
            "amount": amount,
            "date": data.get('date', '')
        }
        
        response = supabase.table('sales').insert(new_sale).execute()
        
        if len(response.data) > 0:
            return jsonify(response.data[0]), 201
        return jsonify({"error": "Failed to insert"}), 500
    except ValueError:
         return jsonify({"error": "Amount must be a number"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sales/<sale_id>', methods=['PUT'])
def replace_sale(sale_id):
    if not supabase:
        return jsonify({"error": "Database not configured. Please add Supabase credentials to .env"}), 500
    try:
        data = request.json
        if not data or not data.get('product') or not data.get('amount'):
            return jsonify({"error": "Product and amount are required for PUT"}), 400
            
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400
            
        update_data = {
            "product": data['product'],
            "amount": amount,
            "date": data.get('date', '')
        }
        
        response = supabase.table('sales').update(update_data).eq("id", sale_id).execute()
        
        if len(response.data) > 0:
             return jsonify(response.data[0]), 200
        else:
             return jsonify({"error": "Sale not found"}), 404
             
    except ValueError:
         return jsonify({"error": "Amount must be a number"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sales/<sale_id>', methods=['PATCH'])
def update_sale(sale_id):
    if not supabase:
        return jsonify({"error": "Database not configured. Please add Supabase credentials to .env"}), 500
    try:
        data = request.json
        update_data = {}
        if 'product' in data:
            update_data['product'] = data['product']
        if 'amount' in data:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({"error": "Amount must be greater than 0"}), 400
            update_data['amount'] = amount
        if 'date' in data:
            update_data['date'] = data['date']
            
        response = supabase.table('sales').update(update_data).eq("id", sale_id).execute()
        
        if len(response.data) > 0:
             return jsonify(response.data[0]), 200
        else:
             return jsonify({"error": "Sale not found"}), 404
             
    except ValueError:
         return jsonify({"error": "Amount must be a number"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sales/<sale_id>', methods=['DELETE'])
def delete_sale(sale_id):
    if not supabase:
        return jsonify({"error": "Database not configured. Please add Supabase credentials to .env"}), 500
    try:
        response = supabase.table('sales').delete().eq("id", sale_id).execute()
        
        if len(response.data) > 0:
            return '', 204 
        else:
            return jsonify({"error": "Sale not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=8080, debug=True)

