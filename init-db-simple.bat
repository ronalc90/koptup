@echo off
echo Inicializando base de datos KopTup...

REM Ejecutar comandos SQL uno por uno
docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT 'user' NOT NULL, is_active BOOLEAN DEFAULT true, email_verified BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_login TIMESTAMP);"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS documents (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, filename VARCHAR(255) NOT NULL, original_filename VARCHAR(255) NOT NULL, file_path TEXT NOT NULL, file_size INTEGER NOT NULL, mime_type VARCHAR(100) NOT NULL, text_content TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS document_embeddings (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE, chunk_index INTEGER NOT NULL, chunk_text TEXT NOT NULL, embedding JSONB NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(document_id, chunk_index));"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS chat_sessions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES users(id) ON DELETE SET NULL, session_token VARCHAR(255) UNIQUE NOT NULL, is_anonymous BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMP);"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS chat_messages (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE, role VARCHAR(50) NOT NULL, content TEXT NOT NULL, document_ids JSONB, metadata JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS contact_submissions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(50), company VARCHAR(255), service VARCHAR(100), message TEXT NOT NULL, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, processed_at TIMESTAMP);"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS quote_requests (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES users(id) ON DELETE SET NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(50), company VARCHAR(255), service VARCHAR(100) NOT NULL, plan VARCHAR(50), budget VARCHAR(100), description TEXT NOT NULL, requirements JSONB, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS blog_posts (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), slug VARCHAR(255) UNIQUE NOT NULL, title_es VARCHAR(500) NOT NULL, title_en VARCHAR(500) NOT NULL, content_es TEXT NOT NULL, content_en TEXT NOT NULL, excerpt_es TEXT, excerpt_en TEXT, author_id UUID REFERENCES users(id) ON DELETE SET NULL, category VARCHAR(100), tags JSONB, featured_image TEXT, is_published BOOLEAN DEFAULT false, published_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE TABLE IF NOT EXISTS settings (key VARCHAR(255) PRIMARY KEY, value JSONB NOT NULL, description TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

echo Creando indices...
docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);"
docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);"
docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);"
docker exec gestion_curso_db psql -U postgres -d koptup_db -c "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);"

echo Insertando datos iniciales...
docker exec gestion_curso_db psql -U postgres -d koptup_db -c "INSERT INTO users (id, email, password, name, role, is_active, email_verified) VALUES (uuid_generate_v4(), 'admin@koptup.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvApYzW3q', 'Admin', 'admin', true, true) ON CONFLICT (email) DO NOTHING;"

echo.
echo ================================================
echo Base de datos inicializada correctamente!
echo Usuario admin: admin@koptup.com
echo Password: Admin123!
echo ================================================
pause
