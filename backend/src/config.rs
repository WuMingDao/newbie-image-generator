use std::env;

/// Application configuration loaded from environment variables
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct Config {
    /// Server host address
    pub host: String,
    /// Server port
    pub port: u16,
    /// ComfyUI server URL
    pub comfyui_url: String,
    /// ComfyUI WebSocket URL
    pub comfyui_ws_url: String,
    /// Public base URL for this backend (used in image URLs)
    pub public_base_url: String,
    /// Allowed CORS origins
    pub cors_origins: Vec<String>,
}

impl Config {
    /// Load configuration from environment variables
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let port = env::var("PORT")
            .unwrap_or_else(|_| "3000".to_string())
            .parse()
            .expect("PORT must be a valid number");

        let comfyui_host = env::var("COMFYUI_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let comfyui_port = env::var("COMFYUI_PORT").unwrap_or_else(|_| "8188".to_string());

        let comfyui_url = format!("http://{}:{}", comfyui_host, comfyui_port);
        let comfyui_ws_url = format!("ws://{}:{}/ws", comfyui_host, comfyui_port);
        let public_base_url = env::var("PUBLIC_BASE_URL")
            .unwrap_or_else(|_| format!("http://localhost:{}", port))
            .trim_end_matches('/')
            .to_string();

        let cors_origins = env::var("CORS_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3001,http://127.0.0.1:3001".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .collect();

        Self {
            host,
            port,
            comfyui_url,
            comfyui_ws_url,
            public_base_url,
            cors_origins,
        }
    }

    /// Get the server address string
    pub fn server_addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}
