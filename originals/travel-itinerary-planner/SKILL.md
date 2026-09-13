---
name: travel-itinerary-planner
title: Travel Itinerary Planner
description: Plan realistic, delightful trips — day-by-day itineraries with geographic clustering, travel times, opening hours, budget ranges, bookings checklist, packing list, local etiquette and backup plans for bad weather. Use when someone asks to plan a trip, vacation, honeymoon, business trip, weekend getaway or multi-city route.
license: MIT
category: personal-lifestyle
---

# Travel Itinerary Planner

Great itineraries feel effortless because the hard constraints were handled up front.
Work in this order: **constraints → skeleton → days → logistics → polish.**

## 1. Collect constraints (ask only what's missing)

Dates & flexibility · origin · travelers (ages, mobility, kids) · budget level (shoestring / mid / luxury, and currency) · pace (relaxed ≈ 2 anchors/day, active ≈ 3–4) · interests (top 3) · must-sees / must-avoid · accommodation style · dietary needs · visa/passport situation.
If the user gave little detail, pick sensible defaults and state them in one line.

## 2. Skeleton

- Decide **bases** (where to sleep) first: minimize hotel changes; ≥ 2 nights per base unless it's a road trip.
- Allocate days per base by interest density; add a **buffer day** for trips > 7 days.
- Order cities to avoid backtracking; note transfer mode + duration between bases (train/flight/drive).

## 3. Day design rules

- **Cluster by neighborhood** — each day lives in 1–2 adjacent areas; never cross the city twice.
- One **anchor** in the morning (best light, fewer crowds), one in the afternoon, a flexible evening.
- Check **opening days/hours** (museums often close Mondays/Tuesdays) and flag anything needing advance tickets.
- Put jet-lag-friendly, low-commitment plans on arrival day; nothing unmissable on the last morning.
- Meals: suggest *areas or types* of places plus 1–2 well-known examples; mark reservations-needed.
- Always include a **rain / low-energy alternative** for outdoor days.

## 4. Output format

```
## Day 3 — Kyoto: Higashiyama & Gion  (walking ~9 km)
- 07:30  Fushimi Inari before crowds (2.5 h) — free
- 11:00  Train to Gion-Shijo (15 min)
- 11:30  Lunch: Nishiki Market area
- 13:30  Kiyomizu-dera → Sannenzaka lanes (3 h) — ¥400
- 18:00  Pontocho alley dinner (reserve)
☔ Alt: Kyoto National Museum + tea ceremony
💴 Est. day spend: ¥9,000–14,000 pp
```
Then: bookings checklist (with lead times), transport passes worth buying (and whether they pay off), budget table (lodging / food / transport / activities / buffer 10%), packing list tuned to season & activities, etiquette & safety notes, emergency info (local emergency number, embassy, insurance).

## 5. Quality bar

- Every day passes the "could a real person do this without rushing?" test (include transit time).
- Prices are ranges with the currency and a note that they're estimates to verify.
- Never invent specific opening hours, prices or availability as facts — label them "typical" and tell the user to confirm, or look them up if a browsing tool is available.
- Accessibility and kid/elderly needs change pace, transport and venue choices — reflect them explicitly.
