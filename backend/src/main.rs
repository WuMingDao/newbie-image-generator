mod api;
mod comfyui;
mod config;
mod error;
mod models;

use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::api::{create_router, start_comfyui_listener, AppState};
use crate::comfyui::ComfyUIClient;
use crate::config::Config;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=info,axum::rejection=trace".into()),
        )
        .init();

    // Load configuration
    let config = Arc::new(Config::from_env());
    tracing::info!("Configuration loaded");
    tracing::info!("ComfyUI URL: {}", config.comfyui_url);

    // Create ComfyUI client
    let comfyui = ComfyUIClient::new(config.clone());

    // Check ComfyUI connection
    match comfyui.health_check().await {
        Ok(true) => tracing::info!("ComfyUI is reachable"),
        Ok(false) => tracing::warn!("ComfyUI is not responding"),
        Err(e) => tracing::warn!("Failed to check ComfyUI: {}", e),
    }

    // Create event broadcast channel
    let (event_tx, _) = broadcast::channel::<String>(100);

    // Create application state
    let comfyui_client_id = uuid::Uuid::new_v4().to_string();
    tracing::info!("ComfyUI client_id: {}", comfyui_client_id);

    let state = AppState {
        comfyui: comfyui.clone(),
        event_tx: event_tx.clone(),
        comfyui_client_id: comfyui_client_id.clone(),
    };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Create router with middleware
    let app = create_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Start ComfyUI WebSocket listener in background
    let comfyui_for_listener = comfyui.clone();
    let event_tx_for_listener = event_tx.clone();
    let client_id_for_listener = comfyui_client_id.clone();
    tokio::spawn(async move {
        start_comfyui_listener(
            comfyui_for_listener,
            event_tx_for_listener,
            client_id_for_listener,
        )
        .await;
    });

    // Start server
    let addr = config.server_addr();
    let listener = TcpListener::bind(&addr)
        .await
        .expect("Failed to bind listener");

    tracing::info!("Server listening on http://{}", addr);
    tracing::info!("API endpoints:");
    tracing::info!("  GET  /            - API info");
    tracing::info!("  GET  /health      - Health check");
    tracing::info!("  GET  /api/status  - System status");
    tracing::info!("  POST /api/generate - Generate image");
    tracing::info!("  GET  /api/queue   - Queue status");
    tracing::info!("  GET  /api/history/{{prompt_id}} - Get history");
    tracing::info!("  GET  /api/images/{{filename}} - Get image");
    tracing::info!("  POST /api/interrupt - Interrupt execution");
    tracing::info!("  POST /api/clear   - Clear queue");
    tracing::info!("  WS   /ws          - WebSocket events");

    axum::serve(listener, app).await.expect("Server crashed");
}
