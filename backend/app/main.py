import collections, time
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from .api.routes import router
from .core.config import settings
from .services.market_data import MarketDataError

app = FastAPI(title="StockShield API", version="1.0.0", description="Educational stock risk analysis. Not financial advice.")
_hits = collections.defaultdict(list)


def err(status, code, message):
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    recent = [t for t in _hits[ip] if now - t < 60]
    if len(recent) >= settings.rate_limit:
        return err(429, "rate_limited", "Too many requests. Please slow down.")
    recent.append(now); _hits[ip] = recent
    return await call_next(request)


app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(MarketDataError)
async def md_error(_, e: MarketDataError): return err(e.status, e.code, e.message)

@app.exception_handler(StarletteHTTPException)
async def http_error(_, e): return err(e.status_code, "http_error", str(e.detail))

@app.exception_handler(RequestValidationError)
async def validation_error(_, e):
    first = e.errors()[0] if e.errors() else {}
    return err(422, "validation_error", f"Invalid input: {'.'.join(str(x) for x in first.get('loc', [])[1:])} {first.get('msg', '')}".strip())

@app.exception_handler(Exception)
async def unhandled(_, e): return err(500, "internal_error", "An unexpected error occurred.")


app.include_router(router)
