from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/services")
async def get_services(request: Request):
    store = request.app.state.store
    return {"categories": store.categories}


@router.get("/cities")
async def get_cities(request: Request):
    store = request.app.state.store
    return {"cities": store.cities}


@router.get("/services/{category_id}")
async def get_service(category_id: str, request: Request):
    store = request.app.state.store
    cat = store.get_category(category_id)
    if not cat:
        return {"error": "not_found", "category_id": category_id}
    return cat
