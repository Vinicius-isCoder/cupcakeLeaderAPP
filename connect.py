import psycopg2

try:
    conexao = psycopg2.connect(
        database="railway",
        user="postgres",
        password="oHzprulMIQHamieUOhLQfiyabEkjYjZr",
        host="junction.proxy.rlwy.net",
        port="24490"
    )
    conexao.autocommit = True
    print("Conexão bem-sucedida!")

except Exception as e:
    print("Erro na conexão:", e)