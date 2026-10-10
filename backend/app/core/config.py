"""Settings are read from environment variables on every access, so tests can change them."""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    @property
    def provider(self): return os.getenv("MARKET_DATA_PROVIDER", "alphavantage").strip().lower()
    @property
    def api_key(self): return os.getenv("MARKET_DATA_API_KEY", "").strip()
    @property
    def outputsize(self): return os.getenv("ALPHAVANTAGE_OUTPUTSIZE", "compact")
    @property
    def supabase_url(self): return os.getenv("SUPABASE_URL", "").rstrip("/")
    @property
    def supabase_key(self): return os.getenv("SUPABASE_ANON_KEY", "")
    @property
    def cors_origins(self): return [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
    @property
    def rate_limit(self): return int(os.getenv("RATE_LIMIT_PER_MIN", "120"))
    @property
    def demo(self): return self.provider == "demo"


settings = Settings()
