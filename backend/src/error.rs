use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

/// Application error types
#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum AppError {
    #[error("ComfyUI connection error: {0}")]
    ComfyUIConnection(String),

    #[error("ComfyUI API error: {0}")]
    ComfyUIApi(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("WebSocket error: {0}")]
    WebSocket(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("HTTP client error: {0}")]
    HttpClient(#[from] reqwest::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            AppError::ComfyUIConnection(msg) => (StatusCode::SERVICE_UNAVAILABLE, msg.clone()),
            AppError::ComfyUIApi(msg) => (StatusCode::BAD_GATEWAY, msg.clone()),
            AppError::InvalidRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::WebSocket(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::Serialization(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::HttpClient(e) => (StatusCode::BAD_GATEWAY, e.to_string()),
        };

        tracing::error!("API error: {} - {}", status, error_message);

        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16()
        }));

        (status, body).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
