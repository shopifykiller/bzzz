#!/usr/bin/env python3
"""Download Wikipedia plant photos and write catalog data."""
from __future__ import annotations

import io
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "img" / "plants"
JS_PATH = ROOT / "js" / "plants-data.js"
UA = "PchelosharingCatalog/1.0 (local mock catalog; plants page)"
BG = (248, 247, 245)
SIZE = 640

PLANTS = [
    # Комнатные
    {"id": "monstera-deliciosa", "name": "Монстера деликатесная", "latin": "Monstera deliciosa", "wiki": "Monstera_deliciosa", "cat": "room", "catLabel": "Комнатные", "price": 4900, "lead": "Дырявые листья, которые все фотографируют. Растёт быстро, если не забывать поливать. Как улей: живая штука, а не декор из Икеи."},
    {"id": "ficus-lyrata", "name": "Фикус лирата", "latin": "Ficus lyrata", "wiki": "Ficus_lyrata", "cat": "room", "catLabel": "Комнатные", "price": 6900, "lead": "Большие скрипичные листья. Любит свет и не любит, когда его переставляют. Характер есть — это хорошо."},
    {"id": "strelitzia-reginae", "name": "Стрелиция королевская", "latin": "Strelitzia reginae", "wiki": "Strelitzia_reginae", "cat": "room", "catLabel": "Комнатные", "price": 5400, "lead": "Цветок-птица. В комнате ведёт себя спокойно, а цветёт — как будто в гости прилетел кто-то яркий из Африки."},
    {"id": "calathea-orbifolia", "name": "Калатея орбифолия", "latin": "Goeppertia orbifolia", "wiki": "Goeppertia_orbifolia", "cat": "room", "catLabel": "Комнатные", "price": 3200, "lead": "Полосатые круглые листья. На ночь складывает их, как будто говорит «всё, я спать». Можно понять."},
    {"id": "alocasia-amazonica", "name": "Алоказия амазонская", "latin": "Alocasia × amazonica", "wiki": "Alocasia", "cat": "room", "catLabel": "Комнатные", "price": 2800, "lead": "Графика на листьях, будто её рисовали тушью. Любит влажный воздух. Пчёлы бы оценили, но это растение — для дома."},
    {"id": "philodendron-birkin", "name": "Филодендрон биркин", "latin": "Philodendron 'Birkin'", "wiki": "Philodendron", "cat": "room", "catLabel": "Комнатные", "price": 2500, "lead": "Белые штрихи по тёмно-зелёному. Не капризный. Хороший первый экзот, если хочется чего-то «не фиалка»."},
    {"id": "sansevieria-cylindrica", "name": "Сансевиерия цилиндрика", "latin": "Dracaena angolensis", "wiki": "Dracaena_angolensis", "cat": "room", "catLabel": "Комнатные", "price": 1900, "lead": "Круглые мечи вместо листьев. Почти не требует внимания. Для тех, кто любит живое, но не готов к ежедневным ритуалам."},
    {"id": "zamioculcas", "name": "Замиокулькас", "latin": "Zamioculcas zamiifolia", "wiki": "Zamioculcas_zamiifolia", "cat": "room", "catLabel": "Комнатные", "price": 2200, "lead": "Долларовое дерево. Шутки про зарплату прилагаются бесплатно. Растёт медленно и уверенно, как хорошая пасека."},
    {"id": "chamaedorea-elegans", "name": "Хамедорея изящная", "latin": "Chamaedorea elegans", "wiki": "Chamaedorea_elegans", "cat": "room", "catLabel": "Комнатные", "price": 2700, "lead": "Комнатная пальма, которая помещается в угол у окна. Не надо переезжать в тропики — тропики можно пригласить."},
    {"id": "spathiphyllum", "name": "Спатифиллум «Сенсейшн»", "latin": "Spathiphyllum", "wiki": "Spathiphyllum", "cat": "room", "catLabel": "Комнатные", "price": 2400, "lead": "Белые паруса. Если засушить — обидится и поникнет, потом отпоите и простит. Честный индикатор вашей забывчивости."},
    {"id": "anthurium-crystallinum", "name": "Антуриум кристаллинум", "latin": "Anthurium crystallinum", "wiki": "Anthurium_crystallinum", "cat": "room", "catLabel": "Комнатные", "price": 8700, "lead": "Бархатные листья с серебряными жилками. Редкий гость на подоконнике. Не для фона — для разглядывания."},
    {"id": "peperomia-watermelon", "name": "Пеперомия арбузная", "latin": "Peperomia argyreia", "wiki": "Peperomia_argyreia", "cat": "room", "catLabel": "Комнатные", "price": 980, "lead": "Маленькая, полосатая, совсем как арбуз, только есть нельзя. Зато можно поставить на стол и улыбаться."},
    {"id": "hoya-carnosa", "name": "Хойя мясистая", "latin": "Hoya carnosa", "wiki": "Hoya_carnosa", "cat": "room", "catLabel": "Комнатные", "price": 1600, "lead": "Восковой плющ. Цветёт зонтиками, пахнет так, что гости спрашивают: «у вас что, конфета?» Нет. Растение."},
    {"id": "maranta-leuconeura", "name": "Маранта беложильчатая", "latin": "Maranta leuconeura", "wiki": "Maranta_leuconeura", "cat": "room", "catLabel": "Комнатные", "price": 1400, "lead": "Молитвенное растение: вечером поднимает листья. Можно завести ритуал — смотреть, как оно укладывается спать."},
    {"id": "begonia-maculata", "name": "Бегония макулата", "latin": "Begonia maculata", "wiki": "Begonia_maculata", "cat": "room", "catLabel": "Комнатные", "price": 1800, "lead": "Горошек на листьях и красная изнанка. Выглядит так, будто её придумали для журнала, а не для подоконника."},
    {"id": "nephrolepis", "name": "Нефролепис возвышенный", "latin": "Nephrolepis exaltata", "wiki": "Nephrolepis_exaltata", "cat": "room", "catLabel": "Комнатные", "price": 1500, "lead": "Классический папоротник. Любит душ и не любит батарею. Зато фон для чтения — как в оранжерее."},
    {"id": "dracaena-marginata", "name": "Драцена окаймлённая", "latin": "Dracaena reflexa var. angustifolia", "wiki": "Dracaena_marginata", "cat": "room", "catLabel": "Комнатные", "price": 3100, "lead": "Тонкий ствол и султан листьев. Занимает мало места по полу и много — по вертикали. Умная геометрия для квартиры."},
    {"id": "yucca", "name": "Юкка слоновая", "latin": "Yucca gigantea", "wiki": "Yucca_gigantea", "cat": "room", "catLabel": "Комнатные", "price": 4500, "lead": "Пенёк с характером. Свет, редкий полив, и она стоит как скульптура. Хороша в большой комнате."},
    {"id": "aglaonema", "name": "Аглаонема сиамская", "latin": "Aglaonema", "wiki": "Aglaonema", "cat": "room", "catLabel": "Комнатные", "price": 2100, "lead": "Цветные листья даже в полутени. Для северных окон, где фикус грустит, а эта — нет."},
    {"id": "pilea-peperomioides", "name": "Пилея пеперомиоидес", "latin": "Pilea peperomioides", "wiki": "Pilea_peperomioides", "cat": "room", "catLabel": "Комнатные", "price": 1200, "lead": "Китайское денежное. Круглые листья на тонких ножках. Даёт деток — можно раздавать друзьям, как баночки мёда."},
    # Плодовые
    {"id": "fig-brown-turkey", "name": "Инжир Brown Turkey", "latin": "Ficus carica", "wiki": "Ficus_carica", "cat": "fruit", "catLabel": "Плодовые", "price": 3900, "lead": "Можно в кадке дома, можно в грунт в Приволжье с укрытием. Сладкие плоды. Пчёлы к цветкам не летят — инжир опыляется иначе. Зато вам — варенье."},
    {"id": "pomegranate-dwarf", "name": "Гранат карликовый", "latin": "Punica granatum", "wiki": "Punica_granatum", "cat": "fruit", "catLabel": "Плодовые", "price": 3400, "lead": "Алые цветки, потом плоды. Карликовая форма живёт в горшке и не делает вид, что ей нужен Крым."},
    {"id": "persimmon-sharon", "name": "Хурма Шарон", "latin": "Diospyros kaki", "wiki": "Diospyros_kaki", "cat": "fruit", "catLabel": "Плодовые", "price": 5200, "lead": "Дерево с осенними плодами, которые стоит дождаться. Многолетняя история, как яблоня на нашей земле."},
    {"id": "japonica-quince", "name": "Айва японская", "latin": "Chaenomeles japonica", "wiki": "Chaenomeles_japonica", "cat": "fruit", "catLabel": "Плодовые", "price": 1800, "lead": "Весной горит цветом — пчёлы в восторге. Плоды кислые, на варенье и компот. Медонос и урожай в одном кусте."},
    {"id": "apple-antonovka", "name": "Яблоня Антоновка", "latin": "Malus domestica", "wiki": "Antonovka", "cat": "fruit", "catLabel": "Плодовые", "price": 4500, "lead": "Именная яблоня на землях Приволжья. Как улей, только с яблоками. Цветёт — пасека гудит. Растёт годами, и чем дольше владеете, тем щедрее."},
    {"id": "pear-pamyat", "name": "Груша Память Яковлева", "latin": "Pyrus communis", "wiki": "Pyrus_communis", "cat": "fruit", "catLabel": "Плодовые", "price": 4300, "lead": "Надёжный сорт для нашей зимы. Цветение — отдельный сезон для пчёл. Урожай — для вас."},
    {"id": "cherry-shokoladnitsa", "name": "Вишня Шоколадница", "latin": "Prunus cerasus", "wiki": "Prunus_cerasus", "cat": "fruit", "catLabel": "Плодовые", "price": 4100, "lead": "Тёмная ягода, имя как десерт. Весной — белая пена цветков. Пчёлы работают, вы потом собираете."},
    {"id": "plum-vengerka", "name": "Слива Венгерка", "latin": "Prunus domestica", "wiki": "Prunus_domestica", "cat": "fruit", "catLabel": "Плодовые", "price": 4000, "lead": "Синие плоды, из которых получается и компот, и характер. Дерево на годы, не на сезон."},
    {"id": "alycha-kuban", "name": "Алыча Кубанская комета", "latin": "Prunus cerasifera", "wiki": "Prunus_cerasifera", "cat": "fruit", "catLabel": "Плодовые", "price": 3800, "lead": "Ранняя, щедрая, почти без капризов. Цветёт так, что пасека рядом — не украшение, а смысл."},
    {"id": "walnut-ideal", "name": "Орех грецкий «Идеал»", "latin": "Juglans regia", "wiki": "Juglans_regia", "cat": "fruit", "catLabel": "Плодовые", "price": 6200, "lead": "Долгая инвестиция. Сажаете не «на этот год», а чтобы через годы щёлкать свои орехи. Идеал — скороплодный, не придётся ждать век."},
    # Цитрусы
    {"id": "lemon-meyer", "name": "Лимон Мейера", "latin": "Citrus × meyeri", "wiki": "Meyer_lemon", "cat": "citrus", "catLabel": "Цитрусы", "price": 2900, "lead": "Комнатный лимон, который реально плодоносит. Цветки пахнут так, что хочется открыть окно и одновременно не открывать."},
    {"id": "orange-navel", "name": "Апельсин Вашингтон Невел", "latin": "Citrus × sinensis", "wiki": "Citrus_sinensis", "cat": "citrus", "catLabel": "Цитрусы", "price": 3600, "lead": "Классика в кадке. Зимой — золотые шары среди тёмных листьев. Летом можно вынести на балкон — пусть привыкает к солнцу."},
    {"id": "mandarin-unshiu", "name": "Мандарин Уншиу", "latin": "Citrus unshiu", "wiki": "Citrus_unshiu", "cat": "citrus", "catLabel": "Цитрусы", "price": 3300, "lead": "Тот самый новогодний запах, только живой и круглый год. Без косточек, с характером кадочного дерева."},
    {"id": "calamondin", "name": "Каламондин", "latin": "Citrus × microcarpa", "wiki": "Citrus_×_microcarpa", "cat": "citrus", "catLabel": "Цитрусы", "price": 2400, "lead": "Маленькие оранжевые плоды прямо на ветках с цветками. Выглядит как витрина, живёт как растение. Кисло-сладкий, на чай."},
    {"id": "kumquat-nagami", "name": "Кумкват Нагами", "latin": "Citrus japonica", "wiki": "Kumquat", "cat": "citrus", "catLabel": "Цитрусы", "price": 3100, "lead": "Едят вместе с кожурой. Странно звучит, пока не попробуете. Компактный, щедрый, очень «экзотический» без пафоса."},
    {"id": "feijoa", "name": "Фейхоа", "latin": "Acca sellowiana", "wiki": "Acca_sellowiana", "cat": "citrus", "catLabel": "Цитрусы", "price": 2800, "lead": "Не цитрус, но лежит рядом в голове. Цветки съедобные, плоды — вкус киви с клубникой. Пчёлы цветение уважают."},
    {"id": "loquat", "name": "Мушмула японская", "latin": "Eriobotrya japonica", "wiki": "Eriobotrya_japonica", "cat": "fruit", "catLabel": "Плодовые", "price": 3500, "lead": "Зимой цветёт, весной плоды. Перепутанный календарь — и в этом прелесть. В кадке или в укрывной культуре."},
    {"id": "kiwi", "name": "Актинидия деликатесная", "latin": "Actinidia deliciosa", "wiki": "Actinidia_deliciosa", "cat": "fruit", "catLabel": "Плодовые", "price": 1900, "lead": "Киви-лиана. Нужна опора и немного терпения. Зато потом — свои плоды, не из ящика на прилавке."},
    {"id": "banana-dwarf", "name": "Банан киевский карлик", "latin": "Musa acuminata", "wiki": "Musa_acuminata", "cat": "tropic", "catLabel": "Тропические", "price": 4700, "lead": "Огромные листья сразу делают из комнаты оранжерею. Плоды в квартире — лотерея, вид — гарантирован."},
    {"id": "coffee-arabica", "name": "Кофейное дерево арабика", "latin": "Coffea arabica", "wiki": "Coffea_arabica", "cat": "tropic", "catLabel": "Тропические", "price": 2600, "lead": "Блестящие листья, белые душистые цветки, красные ягоды. Свой кофе — скорее ритуал, чем экономика. Ритуалы мы любим."},
    # Медоносы и экзотика сада
    {"id": "lavender", "name": "Лаванда узколистная", "latin": "Lavandula angustifolia", "wiki": "Lavandula_angustifolia", "cat": "honey", "catLabel": "Медоносы", "price": 890, "lead": "Пчёлы на ней работают, вы вдыхаете. Сажайте ближе к пасеке и к скамейке. Оба будут довольны."},
    {"id": "linden", "name": "Липа мелколистная", "latin": "Tilia cordata", "wiki": "Tilia_cordata", "cat": "honey", "catLabel": "Медоносы", "price": 5400, "lead": "Главный медонос средней полосы. Дерево на десятилетия. Цветение — это запах июня и будущий мёд в банке."},
    {"id": "black-locust", "name": "Акация белая", "latin": "Robinia pseudoacacia", "wiki": "Robinia_pseudoacacia", "cat": "honey", "catLabel": "Медоносы", "price": 2200, "lead": "Гроздья белых цветков, акациевый мёд, который все хвалят. Растёт быстро. Для пасеки — почти обязательная гостья."},
    {"id": "lemon-eucalyptus", "name": "Эвкалипт лимонный", "latin": "Corymbia citriodora", "wiki": "Corymbia_citriodora", "cat": "tropic", "catLabel": "Тропические", "price": 2100, "lead": "Пахнет лимоном, выглядит как гость из Австралии. В кадке на лето — на улицу, зимой — в светлую комнату."},
    {"id": "oleander", "name": "Олеандр", "latin": "Nerium oleander", "wiki": "Nerium_oleander", "cat": "tropic", "catLabel": "Тропические", "price": 2300, "lead": "Цветёт долго и щедро. Ядовит — детям и котам не в зубы, в кадке — пожалуйста. Красота с инструкцией."},
    {"id": "hibiscus-syriacus", "name": "Гибискус сирийский", "latin": "Hibiscus syriacus", "wiki": "Hibiscus_syriacus", "cat": "honey", "catLabel": "Медоносы", "price": 1700, "lead": "Суровой зимой спит, летом раскрывает огромные цветки. Пчёлы не проходят мимо. Вы тоже."},
    {"id": "magnolia-grandiflora", "name": "Магнолия крупноцветковая", "latin": "Magnolia grandiflora", "wiki": "Magnolia_grandiflora", "cat": "tropic", "catLabel": "Тропические", "price": 8900, "lead": "Глянцевые вечнозелёные листья и цветки размером с супницу. Для укрывной культуры или кадки. Не скромное растение."},
    {"id": "camellia", "name": "Камелия японская", "latin": "Camellia japonica", "wiki": "Camellia_japonica", "cat": "tropic", "catLabel": "Тропические", "price": 4200, "lead": "Цветёт зимой, когда все остальные честно спят. Капризна к поливу. Если подружитесь — будет как чаепитие каждый январь."},
    {"id": "passionfruit", "name": "Пассифлора съедобная", "latin": "Passiflora edulis", "wiki": "Passiflora_edulis", "cat": "tropic", "catLabel": "Тропические", "price": 1600, "lead": "Цветок, на который нельзя не смотреть. Потом — маракуйя. Лиана для опоры и для разговоров «это что вообще?»"},
    {"id": "date-palm", "name": "Финик Робелена", "latin": "Phoenix roebelenii", "wiki": "Phoenix_roebelenii", "cat": "room", "catLabel": "Комнатные", "price": 7400, "lead": "Настоящая пальма, только вежливого размера. Перья листьев, ствол с характером. Экзотика без переезда на юг."},
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read()


def wiki_thumb(title: str) -> str | None:
    variants = [title, title.replace("_", " "), urllib.parse.unquote(title)]
    for t in variants:
        api = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(t)
        try:
            data = json.loads(fetch(api).decode("utf-8"))
        except Exception as exc:
            print("wiki fail", t, exc)
            continue
        orig = (data.get("originalimage") or {}).get("source")
        thumb = (data.get("thumbnail") or {}).get("source")
        src = orig or thumb
        if src:
            return src.split("?")[0]
    return None


def to_square(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "P"):
        bg = Image.new("RGB", img.size, BG)
        rgba = img.convert("RGBA")
        bg.paste(rgba, mask=rgba.split()[-1])
        img = bg
    else:
        img = img.convert("RGB")
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = int((h - side) * 0.35)
    if top + side > h:
        top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    # Soft studio matte: letterbox-like cream frame so Market-style contain looks natural
    canvas = Image.new("RGB", (SIZE, SIZE), BG)
    inner = int(SIZE * 0.92)
    img = img.resize((inner, inner), Image.Resampling.LANCZOS)
    off = (SIZE - inner) // 2
    canvas.paste(img, (off, off))
    return canvas


def fallback_card(plant: dict) -> Image.Image:
    from PIL import ImageDraw
    img = Image.new("RGB", (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)
    hues = {
        "room": (107, 143, 94),
        "fruit": (196, 146, 42),
        "citrus": (232, 153, 58),
        "tropic": (46, 107, 78),
        "honey": (138, 100, 20),
    }
    c = hues.get(plant["cat"], (107, 143, 94))
    cx, cy = SIZE // 2, int(SIZE * 0.58)
    draw.ellipse((cx - 70, cy + 40, cx + 70, cy + 90), fill=(176, 122, 86))
    for i, r in enumerate((180, 140, 100, 70)):
        col = tuple(max(0, min(255, v + (i - 1) * 18)) for v in c)
        draw.ellipse((cx - r, cy - r - 40, cx + r, cy + r - 80), outline=col, width=8)
    return img


def write_js(plants: list[dict]) -> None:
    payload = []
    for p in plants:
        payload.append({
            "id": p["id"],
            "name": p["name"],
            "latin": p["latin"],
            "cat": p["cat"],
            "catLabel": p["catLabel"],
            "price": p["price"],
            "lead": p["lead"],
            "img": f"assets/img/plants/{p['id']}.webp",
        })
    JS_PATH.parent.mkdir(parents=True, exist_ok=True)
    body = "window.PLANTS = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
    JS_PATH.write_text(body, encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for i, plant in enumerate(PLANTS, 1):
        dest = OUT_DIR / f"{plant['id']}.webp"
        print(f"[{i}/{len(PLANTS)}] {plant['id']}")
        img = None
        src = wiki_thumb(plant["wiki"])
        if src:
            try:
                raw = fetch(src)
                img = Image.open(io.BytesIO(raw))
                img = to_square(img)
                print("  ok", src[-60:])
            except Exception as exc:
                print("  download fail", exc)
                img = None
        if img is None:
            print("  fallback illustration")
            img = fallback_card(plant)
        img.save(dest, "WEBP", quality=82, method=6)
        time.sleep(0.15)
    write_js(PLANTS)
    print("wrote", JS_PATH, "and", len(list(OUT_DIR.glob('*.webp'))), "images")


if __name__ == "__main__":
    main()
