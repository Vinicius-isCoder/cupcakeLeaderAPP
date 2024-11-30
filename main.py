from flask import Flask, request, jsonify, send_from_directory
import jwt
import datetime
import os
import bcrypt
import uuid
from werkzeug.utils import secure_filename
from connect import conexao
from email_validator import validate_email, EmailNotValidError

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

SECRET_KEY = 'sua_chave_secreta'


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def get_user_id_from_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        raise ValueError("Token não fornecido ou inválido")
    
    token = auth_header.split(" ")[1]
    decoded = verify_token(token)
    
    if not decoded:
        raise ValueError("Token inválido ou expirado")
    
    return decoded.get('user_id')

def verify_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Rota não encontrada"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Erro interno no servidor"}), 500

@app.route('/cadastro', methods=['POST'])
def cadastro_usuario():
    try:
        data = request.get_json()
        nome = data.get('nomeUser')
        email = data.get('emailUser')
        senha = data.get('senhaUser')
        cep = data.get('cepUser')
        rua = data.get('ruaUser')
        estado = data.get('estadoUser')

        if not nome or not email or not senha or not cep or not rua or not estado:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        try:
            email = validate_email(email).email
        except EmailNotValidError as e:
            return jsonify({"error": f"Email inválido"}), 400

        if len(senha) < 8:
            return jsonify({"error": "A senha deve ter pelo menos 8 caracteres"}), 400
        if not any(char.isdigit() for char in senha):
            return jsonify({"error": "A senha deve conter pelo menos um número"}), 400
        if not any(char.isupper() for char in senha):
            return jsonify({"error": "A senha deve conter pelo menos uma letra maiúscula"}), 400

        hashed_password = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor = conexao.cursor()
        query = """
            INSERT INTO usuarios (nome, email, senha, cep, rua, estado)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (nome, email, hashed_password, cep, rua, estado))
        conexao.commit()
        cursor.close()

        return jsonify({"message": "Usuário cadastrado com sucesso!"}), 201
    except Exception as e:
        return jsonify({"error": f"Erro ao cadastrar usuário: {str(e)}"}), 500


@app.route('/login', methods=['POST'])
def login_usuario():
    try:
        dados = request.get_json()
        email_user = dados.get('emailUser')
        senha_user = dados.get('senhaUser')

        if not email_user or not senha_user:
            return jsonify({"error": "Email e senha são obrigatórios"}), 400

        cursor = conexao.cursor()
        query = "SELECT id, nome, senha FROM usuarios WHERE email = %s"
        cursor.execute(query, (email_user,))
        usuario = cursor.fetchone()
        cursor.close()

        if usuario:
            user_id, user_name, hashed_password = usuario

            if bcrypt.checkpw(senha_user.encode('utf-8'), hashed_password.encode('utf-8')):
                token = generate_token(user_id)
                return jsonify({
                    "message": "Login realizado com sucesso!",
                    "token": token,
                    "user": {"id": user_id, "nome": user_name}
                }), 200
            else:
                return jsonify({"error": "Email ou senha inválidos"}), 401
        else:
            return jsonify({"error": "Email ou senha inválidos"}), 401
    except Exception as e:
        return jsonify({"error": f"Erro interno no servidor: {str(e)}"}), 500


@app.route('/user-info', methods=['GET'])
def user_info():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Token não fornecido ou inválido"}), 403

    token = auth_header.split(" ")[1]
    decoded = verify_token(token)

    if not decoded:
        return jsonify({"error": "Token inválido ou expirado"}), 401

    user_id = decoded.get('user_id')

    try:
        cursor = conexao.cursor()
        query = """
            SELECT nome, email, cep, rua, estado, profile_image
            FROM usuarios
            WHERE id = %s
        """
        cursor.execute(query, (user_id,))
        usuario = cursor.fetchone()
        cursor.close()

        if usuario:
            profile_image_url = (
                f"https://cupcakeleaderapp-production.up.railway.app/uploads/{usuario[5]}"
                if usuario[5]
                else None  # Retorna None ao invés de URL padrão, para que o frontend use a imagem local
            )

            return jsonify({
                "name": usuario[0],
                "email": usuario[1],
                "cep": usuario[2],
                "rua": usuario[3],
                "estado": usuario[4],
                "profileImage": profile_image_url
            }), 200
        else:
            return jsonify({"error": "Usuário não encontrado"}), 404
    except Exception as e:
        return jsonify({"error": f"Erro ao buscar informações do usuário: {str(e)}"}), 500



@app.route('/remove-profile-image', methods=['DELETE'])
def remove_profile_image():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Token não fornecido ou inválido"}), 403

    token = auth_header.split(" ")[1]
    decoded = verify_token(token)

    if not decoded:
        return jsonify({"error": "Token inválido ou expirado"}), 401

    user_id = decoded['user_id']

    try:
        cursor = conexao.cursor()

        cursor.execute("SELECT profile_image FROM usuarios WHERE id = %s", (user_id,))
        profile_image = cursor.fetchone()[0]

        cursor.execute("UPDATE usuarios SET profile_image = NULL WHERE id = %s", (user_id,))
        conexao.commit()

        if profile_image:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], profile_image)
            if os.path.exists(file_path):
                os.remove(file_path)

        cursor.close()
        return jsonify({"message": "Foto de perfil removida com sucesso!"}), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao remover imagem de perfil: {str(e)}"}), 500

@app.route('/update-user', methods=['PUT'])
def update_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Token não fornecido ou inválido"}), 403

    token = auth_header.split(" ")[1]
    decoded = verify_token(token)

    if not decoded:
        return jsonify({"error": "Token inválido ou expirado"}), 401

    user_id = decoded['user_id']
    data = request.get_json()

    field_mapping = {
        "name": "nome",
        "email": "email",
        "password": "senha",
        "cep": "cep",
        "rua": "rua",
        "estado": "estado",
    }

    try:
        cursor = conexao.cursor()

        if "email" in data:
            try:
                data["email"] = validate_email(data["email"]).email
            except EmailNotValidError as e:
                return jsonify({"error": f"Email inválido"}), 400

        if "password" in data:
            if len(data["password"]) < 8:
                return jsonify({"error": "A senha deve ter pelo menos 8 caracteres"}), 400
            if not any(char.isdigit() for char in data["password"]):
                return jsonify({"error": "A senha deve conter pelo menos um número"}), 400
            if not any(char.isupper() for char in data["password"]):
                return jsonify({"error": "A senha deve conter pelo menos uma letra maiúscula"}), 400

            data["password"] = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        fields = []
        values = []
        for key, value in data.items():
            if key in field_mapping:
                fields.append(f"{field_mapping[key]} = %s")
                values.append(value)

        if not fields:
            return jsonify({"error": "Nenhum campo válido fornecido para atualização"}), 400

        query = f"UPDATE usuarios SET {', '.join(fields)} WHERE id = %s"
        values.append(user_id)
        cursor.execute(query, values)
        conexao.commit()

        cursor.close()
        return jsonify({"message": "Dados do perfil atualizados com sucesso!"}), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao atualizar dados do usuário: {str(e)}"}), 500


@app.route('/update-profile-image', methods=['POST'])
def update_profile_image():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Token não fornecido ou inválido"}), 403

    token = auth_header.split(" ")[1]
    decoded = verify_token(token)

    if not decoded:
        return jsonify({"error": "Token inválido ou expirado"}), 401

    user_id = decoded['user_id']

    if 'profileImage' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['profileImage']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "Arquivo inválido ou não permitido"}), 400

    try:
        filename = secure_filename(file.filename)
        file_name = f"{user_id}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
        file.save(file_path)

        cursor = conexao.cursor()
        query = "UPDATE usuarios SET profile_image = %s WHERE id = %s"
        cursor.execute(query, (file_name, user_id))
        conexao.commit()
        cursor.close()

        profile_image_url = f"https://cupcakeleaderapp-production.up.railway.app/uploads/{file_name}"
        return jsonify({"message": "Imagem de perfil atualizada com sucesso!", "profileImage": profile_image_url}), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao atualizar imagem de perfil: {str(e)}"}), 500


@app.route('/uploads/<path:filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/cupcakes', methods=['GET'])
def get_cupcakes():
    cursor = None
    try:
        cursor = conexao.cursor()
        query = "SELECT id, nome, preco, descricao FROM cupcakes"
        cursor.execute(query)
        cupcakes = cursor.fetchall()

        cupcakes_list = [
            {
                "id": cupcake[0],
                "name": cupcake[1],
                "price": float(cupcake[2]),
                "description": cupcake[3],
                "image": f"{cupcake[1].replace(' ', '')}.png"
            }
            for cupcake in cupcakes
        ]

        return jsonify({"cupcakes": cupcakes_list}), 200
    except Exception as e:
        if cursor:
            conexao.rollback()  # Desfazer transações abertas
        return jsonify({"error": f"Erro ao buscar cupcakes: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/cart', methods=['GET'])
def get_cart():
    try:
        cursor = conexao.cursor()
        query = """
            SELECT c.id, c.nome, c.preco, c.descricao, ci.quantidade
            FROM cart_items ci
            JOIN cupcakes c ON ci.cupcake_id = c.id
        """
        cursor.execute(query)
        cart_items = cursor.fetchall()
        cursor.close()

        cart_list = [
            {
                "id": item[0],
                "name": item[1],
                "price": float(item[2]),
                "description": item[3],
                "quantity": item[4],
                "image": f"{item[1].replace(' ', '')}.png"
            }
            for item in cart_items
        ]

        return jsonify({"cartItems": cart_list}), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao buscar itens do carrinho: {str(e)}"}), 500


@app.route('/cart', methods=['POST'])
def add_to_cart():
    try:
        data = request.get_json()
        cupcake_id = data.get('cupcakeId')
        quantity = data.get('quantity')

        if not cupcake_id or not quantity or quantity <= 0:
            return jsonify({"error": "cupcakeId e quantity válidos são obrigatórios"}), 400

        cursor = conexao.cursor()

        cursor.execute("SELECT quantidade FROM cart_items WHERE cupcake_id = %s", (cupcake_id,))
        existing_item = cursor.fetchone()

        if existing_item:
            new_quantity = existing_item[0] + quantity
            cursor.execute(
                "UPDATE cart_items SET quantidade = %s WHERE cupcake_id = %s",
                (new_quantity, cupcake_id)
            )
        else:
            cursor.execute(
                "INSERT INTO cart_items (cupcake_id, quantidade) VALUES (%s, %s)",
                (cupcake_id, quantity)
            )

        conexao.commit()
        cursor.close()

        return jsonify({"message": "Item adicionado ao carrinho com sucesso!"}), 201
    except Exception as e:
        print(f"Erro ao adicionar item ao carrinho: {e}")  # Log detalhado
        return jsonify({"error": f"Erro ao adicionar item ao carrinho: {str(e)}"}), 500


@app.route('/cart', methods=['DELETE'])
def remove_from_cart():
    try:
        data = request.get_json()
        cupcake_id = data.get('cupcakeId')

        if not cupcake_id:
            return jsonify({"error": "cupcakeId é obrigatório"}), 400

        cursor = conexao.cursor()

        cursor.execute("SELECT 1 FROM cart_items WHERE cupcake_id = %s", (cupcake_id,))
        item = cursor.fetchone()

        if not item:
            return jsonify({"error": "Item não encontrado no carrinho"}), 404

        cursor.execute("DELETE FROM cart_items WHERE cupcake_id = %s", (cupcake_id,))
        conexao.commit()
        cursor.close()

        return jsonify({"message": "Item removido do carrinho com sucesso!"}), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao remover item do carrinho: {str(e)}"}), 500

@app.route('/cart/clear', methods=['DELETE'])
def clear_cart():
    try:
        cursor = conexao.cursor()
    
        cursor.execute("DELETE FROM cart_items")
        conexao.commit()
        cursor.close()

        return jsonify({"message": "Carrinho limpo com sucesso!"}), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao limpar o carrinho: {str(e)}"}), 500  

@app.route('/orders', methods=['POST'])
def save_order():
    try:
        data = request.get_json()
        items = data.get('items')

        if not items or not isinstance(items, list):
            return jsonify({"error": "Itens do pedido são obrigatórios"}), 400

        user_id = get_user_id_from_token()
        purchase_id = str(uuid.uuid4())  # Gera um identificador único para a compra
        cursor = conexao.cursor()

        for item in items:
            cursor.execute(
                """
                INSERT INTO orders (user_id, cupcake_id, quantity, total_price, created_at, purchase_id)
                VALUES (%s, %s, %s, %s, NOW(), %s)
                """,
                (
                    user_id,
                    item['id'],
                    item['quantity'],
                    item['price'] * item['quantity'],
                    purchase_id
                )
            )

        conexao.commit()
        cursor.close()

        return jsonify({"message": "Pedido registrado com sucesso!"}), 201
    except Exception as e:
        print(f"Erro no registro de pedidos: {e}")  # Log para depuração
        return jsonify({"error": f"Erro ao registrar pedido: {str(e)}"}), 500

@app.route('/orders/history', methods=['GET'])
def get_order_history():
    try:
        user_id = get_user_id_from_token()

        cursor = conexao.cursor()
        query = """
            SELECT 
                o.purchase_id,
                MIN(o.created_at) AS created_at, 
                json_agg(
                    json_build_object(
                        'cupcake_name', c.nome,
                        'quantity', o.quantity,
                        'total_price', o.total_price
                    )
                ) AS items
            FROM orders o
            JOIN cupcakes c ON o.cupcake_id = c.id
            WHERE o.user_id = %s
            GROUP BY o.purchase_id
            ORDER BY created_at DESC
        """
        cursor.execute(query, (user_id,))
        orders = cursor.fetchall()
        cursor.close()

        order_history = [
            {
                "purchase_id": order[0],
                 "created_at": order[1].isoformat(),
                "items": order[2]
            }
            for order in orders
        ]

        return jsonify({"orders": order_history}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 401
    except Exception as e:
        print(f"Erro ao buscar histórico de pedidos: {e}")
        return jsonify({"error": "Erro ao buscar histórico de pedidos"}), 500          

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)