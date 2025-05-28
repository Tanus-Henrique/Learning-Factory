from flask import Flask, request, jsonify, send_from_directory
from flask_pymongo import PyMongo
from os.path import join, dirname
from dotenv import load_dotenv
import pandas as pd
import joblib
import os


dotenv_path = join(dirname(__file__), 'auth', '.env')
load_dotenv(dotenv_path)
MONGO_KEY = os.getenv("MONGO_KEY_URI")


app = Flask(__name__)

# Configuração do MongoDB (adicionando nome do banco de dados)
app.config["MONGO_URI"] = MONGO_KEY
mongo = PyMongo(app)  

# Verificar conexão com o MongoDB antes de cada requisição
@app.before_request
def check_mongo_connection():
    try:
        # Tentando um comando básico para verificar a conexão
        mongo.db.command("ping")  # Verifica se a conexão com o MongoDB está ativa
        print("Conexão com o MongoDB bem-sucedida!")
    except Exception as e:
        print(f"Erro ao conectar com o MongoDB: {str(e)}")


# Carregar o modelo treinado
modelo = joblib.load('model/modelo_mlp.pkl')
print("Modelo carregado com sucesso!")

# Variáveis esperadas para o modelo
expected_features = [
    "Age", "Gender", "Ethnicity", "ParentalEducation", 
    "StudyTimeWeekly", "Absences", "Tutoring", "ParentalSupport",
    "Extracurricular", "Sports", "Music", "Volunteering"
]

@app.route('/')
def index():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'index.html')

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Receber os dados enviados pelo frontend (formulário)
        dados = request.get_json()
        
        if not dados or not dados.get("features"):
            return jsonify({"erro": "Faltando 'features' no corpo da requisição ou requisição inválida"}), 400
        
        features = dados["features"]
        print("Features recebidas do frontend:", features)

        # Verificar se todas as features esperadas estão presentes
        if len(features) != len(expected_features):
            return jsonify({"erro": f"Número incorreto de features. Esperado {len(expected_features)} features."}), 400

        # Garantir que as features estão no formato correto
        if not all(isinstance(f, (int, float)) for f in features):
            return jsonify({"erro": "Todas as features devem ser números (int ou float)."}), 400

        # Criar um DataFrame com as features
        entrada_modelo = pd.DataFrame([features], columns=expected_features)
        print("DataFrame com as features recebidas:\n", entrada_modelo)

        # Realizar a predição
        resultado = modelo.predict(entrada_modelo)
        print(f"Resultado da predição: {resultado}")

        # Armazenar a predição no MongoDB
        try:
            predicao = mongo.db.predicoes.insert_one({
                "entrada": features,
                "predicao": int(resultado[0])  # Certificando que o valor da predição será inteiro
            })
            print("Predição armazenada no MongoDB com ID:", predicao.inserted_id)
        except Exception as e:
            print(f"Erro ao armazenar no MongoDB: {str(e)}")
            return jsonify({"erro": "Falha ao armazenar a predição no banco de dados."}), 500

        return jsonify({"predicao": int(resultado[0])})

    except Exception as e:
        print(f"Erro durante a predição: {str(e)}")
        return jsonify({"erro": str(e)}), 400



@app.route('/predicoes', methods=['GET'])
def get_predicoes():
    try:
        # Buscar todas as predições; remova o campo _id, se preferir.
        predicoes = list(mongo.db.predicoes.find({}, {'_id': 0}))
        return jsonify(predicoes)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True)

# if __name__ == "__main__":
    # app.run(host='192.168.0.100', port=5000, debug=True)


# if __name__ == "__main__":
#     app.run(host='0.0.0.0', port=5000, debug=True)
