from datetime import date, timedelta

import pytest

pytestmark = pytest.mark.asyncio


async def make_school(client, headers, name="1-р сургууль", **extra):
    r = await client.post("/api/schools", json={"name": name, **extra}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


async def make_crossing(client, headers, school_id, name="Урд гарц", **extra):
    r = await client.post(
        "/api/crossings",
        json={"school_id": school_id, "name": name, "lat": 47.9, "lng": 106.9, **extra},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


async def test_non_admin_cannot_create(client, auth):
    r = await client.post("/api/schools", json={"name": "x"}, headers=await auth("parent"))
    assert r.status_code == 403


async def test_school_list_has_crossing_count(client, auth):
    h = await auth("admin")
    s = await make_school(client, h)
    await make_crossing(client, h, s["id"])
    await make_crossing(client, h, s["id"], name="Хойд гарц")
    r = await client.get("/api/schools")
    assert [(x["name"], x["crossing_count"]) for x in r.json()] == [("1-р сургууль", 2)]
    # nested school inside a crossing has no crossing_count field at all
    r = await client.get("/api/crossings")
    assert "crossing_count" not in r.json()[0]["school"]


async def test_name_is_stripped_and_required(client, auth):
    h = await auth("admin")
    assert (await client.post("/api/schools", json={"name": "   "}, headers=h)).status_code == 422
    s = await make_school(client, h, name="  Шинэ  ")
    assert s["name"] == "Шинэ"


async def test_patch_null_on_required_field_is_422(client, auth):
    h = await auth("admin")
    s = await make_school(client, h)
    c = await make_crossing(client, h, s["id"])
    assert (await client.patch(f"/api/schools/{s['id']}", json={"name": None}, headers=h)).status_code == 422
    assert (await client.patch(f"/api/crossings/{c['id']}", json={"lat": None}, headers=h)).status_code == 422
    # nullable field may be set to null, partial update keeps the rest
    r = await client.patch(f"/api/schools/{s['id']}", json={"district": None, "khoroo": "5"}, headers=h)
    assert r.status_code == 200 and r.json()["khoroo"] == "5" and r.json()["name"] == "1-р сургууль"


async def test_radius_bounds_on_create_and_update(client, auth):
    h = await auth("admin")
    s = await make_school(client, h)
    r = await client.post(
        "/api/crossings", json={"school_id": s["id"], "name": "x", "lat": 1, "lng": 1, "checkin_radius_m": 0}, headers=h
    )
    assert r.status_code == 422
    c = await make_crossing(client, h, s["id"])
    assert (
        await client.patch(f"/api/crossings/{c['id']}", json={"checkin_radius_m": 5000}, headers=h)
    ).status_code == 422
    r = await client.patch(f"/api/crossings/{c['id']}", json={"checkin_radius_m": 150}, headers=h)
    assert r.status_code == 200 and r.json()["checkin_radius_m"] == 150


async def test_delete_school_cascades_crossings(client, auth):
    h = await auth("admin")
    s = await make_school(client, h)
    c = await make_crossing(client, h, s["id"])
    assert (await client.delete(f"/api/schools/{s['id']}", headers=h)).status_code == 204
    assert (await client.get(f"/api/schools/{s['id']}")).status_code == 404
    assert (await client.get(f"/api/crossings/{c['id']}")).status_code == 404


async def test_delete_blocked_when_shifts_exist(client, auth):
    h = await auth("admin")
    s = await make_school(client, h)
    c = await make_crossing(client, h, s["id"])
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    r = await client.post(
        "/api/shifts",
        json={
            "crossing_id": c["id"],
            "shift_date": tomorrow,
            "start_time": "07:30",
            "duration_minutes": 60,
            "price": 15000,
        },
        headers=await auth("parent"),
    )
    assert r.status_code == 201, r.text
    assert (await client.delete(f"/api/crossings/{c['id']}", headers=h)).status_code == 409
    assert (await client.delete(f"/api/schools/{s['id']}", headers=h)).status_code == 409
