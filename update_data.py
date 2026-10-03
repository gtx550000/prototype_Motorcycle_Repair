import json
import os
import sys

# 1. สร้างไฟล์ categories.json ใหม่ตาม PDF
data = []
id_counter = 1
mapping = {} 

def add_item(code, parent_code, name_th, name_en, icon="🔧"):
    global id_counter
    parent_id = mapping.get(parent_code)
    mapping[code] = id_counter
    data.append({
        "id": id_counter,
        "name": name_th,
        "name_en": name_en,
        "description": f"รหัสอ้างอิง: {code}",
        "icon": icon,
        "parent_id": parent_id,
        "is_active": True,
        "sort_order": id_counter
    })
    id_counter += 1

# หมวดหมู่หลัก (categories)
add_item("CAT001", None, "อะไหล่สิ้นเปลืองและงานเซอร์วิส", "Fast-Moving & Service Parts", "⚙️")
add_item("CAT002", None, "ระบบขับเคลื่อนและช่วงล่าง", "Drive Train & Suspension", "⛓️")
add_item("CAT003", None, "ล้อและยาง", "Wheels & Tires", "🏍️")
add_item("CAT004", None, "ระบบไฟและเครื่องยนต์", "Electrical & Engine Parts", "⚡")
add_item("CAT005", None, "โครงรถและอุปกรณ์ตกแต่ง", "Body & Accessories", "🛵")

# หมวดหมู่ย่อย (subcategories)
add_item("SUB001", "CAT001", "ระบบของเหลว", "Fluids", "💧")
add_item("SUB002", "CAT001", "ระบบไฟและจุดระเบิดพื้นฐาน", "Basic Electrical & Ignition", "🔌")
add_item("SUB003", "CAT001", "ระบบกรอง", "Filters", "🌪️")
add_item("SUB004", "CAT001", "ระบบเบรก", "Brake System", "🛑")
add_item("SUB005", "CAT002", "ระบบโซ่และสเตอร์", "Chain & Sprocket", "🔗")
add_item("SUB006", "CAT002", "ระบบสายพานอัตโนมัติ", "CVT System", "🔄")
add_item("SUB007", "CAT002", "ระบบกันสะเทือน", "Suspension", "〰️")
add_item("SUB008", "CAT002", "ลูกปืนและบูช", "Bearings & Bushings", "🛞")
add_item("SUB009", "CAT003", "ยางรถจักรยานยนต์", "Motorcycle Tires", "🍩")
add_item("SUB010", "CAT003", "อุปกรณ์ล้อ", "Wheel Components", "⚙️")
add_item("SUB011", "CAT004", "ระบบไฟควบคุม", "Electrical Control", "🎛️")
add_item("SUB012", "CAT004", "ระบบจุดระเบิดและชาร์จไฟ", "Ignition & Charging", "🔋")
add_item("SUB013", "CAT004", "ชิ้นส่วนเครื่องยนต์", "Engine Components", "🔥")
add_item("SUB014", "CAT004", "สายควบคุม", "Control Cables", "🐍")
add_item("SUB015", "CAT005", "ชิ้นส่วนภายนอก", "Exterior Body Parts", "🛡️")
add_item("SUB016", "CAT005", "มือจับและอุปกรณ์ควบคุม", "Handlebar & Controls", "🕹️")
add_item("SUB017", "CAT005", "พักเท้าและขาตั้ง", "Footrests & Stands", "🦶")
add_item("SUB018", "CAT005", "น็อตและกิ๊บล็อก", "Bolts & Fasteners", "🔩")
add_item("SUB019", "CAT005", "อุปกรณ์ตกแต่ง", "Accessories", "✨")

# ประเภทอะไหล่ (product_types)
add_item("PT001", "SUB001", "น้ำมันเครื่อง 4 จังหวะ", "4T Engine Oil", "🛢️")
add_item("PT002", "SUB001", "น้ำมันเครื่อง 2 จังหวะ", "2T Engine Oil", "🛢️")
add_item("PT003", "SUB001", "น้ำมันเฟืองท้าย", "Gear Oil", "🛢️")
add_item("PT004", "SUB001", "น้ำมันเบรก", "Brake Fluid", "🧴")
add_item("PT005", "SUB001", "น้ำยาหล่อเย็น", "Coolant", "🧊")
add_item("PT006", "SUB002", "หัวเทียน", "Spark Plug", "🔌")
add_item("PT007", "SUB002", "แบตเตอรี่", "Battery", "🔋")
add_item("PT008", "SUB002", "หลอดไฟหน้า", "Headlight Bulb", "💡")
add_item("PT009", "SUB002", "หลอดไฟท้าย", "Tail Light Bulb", "🚨")
add_item("PT010", "SUB002", "หลอดไฟเลี้ยว", "Turn Signal Bulb", "↔️")
add_item("PT011", "SUB002", "ฟิวส์", "Fuse", "🔌")
add_item("PT012", "SUB003", "กรองอากาศ", "Air Filter", "🌪️")
add_item("PT013", "SUB003", "กรองน้ำมันเครื่อง", "Oil Filter", "🛢️")
add_item("PT014", "SUB003", "กรองน้ำมันเชื้อเพลิง", "Fuel Filter", "⛽")
add_item("PT015", "SUB004", "ผ้าเบรกหน้า", "Front Brake Pad", "🛑")
add_item("PT016", "SUB004", "ผ้าเบรกหลัง", "Rear Brake Pad", "🛑")
add_item("PT017", "SUB004", "ก้ามเบรก", "Brake Shoe", "🛑")
add_item("PT018", "SUB004", "สายเบรก", "Brake Cable", "🐍")
add_item("PT019", "SUB005", "โซ่", "Drive Chain", "🔗")
add_item("PT020", "SUB005", "สเตอร์หน้า", "Front Sprocket", "⚙️")
add_item("PT021", "SUB005", "สเตอร์หลัง", "Rear Sprocket", "⚙️")
add_item("PT023", "SUB006", "สายพานขับเคลื่อน", "Drive Belt", "〰️")
add_item("PT024", "SUB006", "เม็ดตุ้ม", "Roller Weight", "🔘")
add_item("PT025", "SUB006", "ชามขับหน้า", "Front Drive Pulley", "💿")
add_item("PT026", "SUB006", "ผ้าคลัตช์ก้อน", "Clutch Shoe", "🧲")
add_item("PT027", "SUB007", "โช้คอัพหลัง", "Rear Shock Absorber", "➿")
add_item("PT028", "SUB007", "ซีลโช้คหน้า", "Front Fork Seal", "⭕")
add_item("PT029", "SUB007", "น้ำมันโช้ค", "Fork Oil", "🛢️")
add_item("PT030", "SUB007", "สปริงโช้ค", "Shock Spring", "〰️")
add_item("PT031", "SUB008", "ลูกปืนล้อ", "Wheel Bearing", "🛞")
add_item("PT032", "SUB008", "ลูกปืนคอ", "Steering Bearing", "🛞")
add_item("PT033", "SUB008", "บูชตะเกียบหลัง", "Swingarm Bushing", "🔘")
add_item("PT034", "SUB009", "ยางนอกแบบมียางใน", "Tube-Type Tire", "🍩")
add_item("PT035", "SUB009", "ยางนอกแบบไม่มียางใน", "Tubeless Tire", "🍩")
add_item("PT036", "SUB009", "ยางใน", "Inner Tube", "🎈")
add_item("PT037", "SUB010", "ซี่ลวด", "Wheel Spoke", "🥢")
add_item("PT038", "SUB010", "วาล์วลม", "Tire Valve", "📍")
add_item("PT039", "SUB010", "ยางรองขอบล้อ", "Rim Tape", "🎀")
add_item("PT040", "SUB011", "กล่อง CDI", "CDI Unit", "⬛")
add_item("PT041", "SUB011", "กล่อง ECU", "ECU Unit", "💻")
add_item("PT042", "SUB011", "สวิตช์กุญแจ", "Ignition Switch", "🔑")
add_item("PT043", "SUB011", "สวิตช์แฮนด์", "Handlebar Switch", "🕹️")
add_item("PT044", "SUB012", "แผ่นชาร์จ", "Regulator Rectifier", "🔋")
add_item("PT045", "SUB012", "คอยล์จุดระเบิด", "Ignition Coil", "⚡")
add_item("PT046", "SUB012", "มัดไฟ", "Stator Coil", "🧶")
add_item("PT047", "SUB013", "ชุดลูกสูบและแหวน", "Piston & Ring Set", "🛢️")
add_item("PT048", "SUB013", "ปะเก็นชุดใหญ่", "Full Gasket Set", "📄")
add_item("PT049", "SUB013", "ปะเก็นชุดเล็ก", "Top Gasket Set", "📄")
add_item("PT050", "SUB013", "วาล์วไอดี", "Intake Valve", "🍄")
add_item("PT051", "SUB013", "วาล์วไอเสีย", "Exhaust Valve", "🍄")
add_item("PT052", "SUB013", "ซีลเครื่องยนต์", "Engine Oil Seal", "⭕")
add_item("PT053", "SUB014", "สายเร่ง", "Throttle Cable", "🐍")
add_item("PT054", "SUB014", "สายไมล์", "Speedometer Cable", "🐍")
add_item("PT055", "SUB014", "สายคลัตช์", "Clutch Cable", "🐍")
add_item("PT056", "SUB015", "กระจกมองข้าง", "Side Mirror", "🪞")
add_item("PT057", "SUB015", "บังโคลน", "Fender", "🛡️")
add_item("PT058", "SUB015", "หน้ากากรถ", "Front Cover", "🎭")
add_item("PT059", "SUB015", "ฝาครอบข้าง", "Side Cover", "🛡️")
add_item("PT060", "SUB016", "มือเบรก", "Brake Lever", "🕹️")
add_item("PT061", "SUB016", "มือคลัตช์", "Clutch Lever", "🕹️")
add_item("PT062", "SUB016", "ปลอกแฮนด์", "Handle Grip", "✊")
add_item("PT063", "SUB017", "พักเท้าหน้า", "Front Footrest", "🦶")
add_item("PT064", "SUB017", "พักเท้าหลัง", "Rear Footrest", "🦶")
add_item("PT065", "SUB017", "ขาตั้งกลาง", "Center Stand", "🏗️")
add_item("PT066", "SUB017", "ขาตั้งข้าง", "Side Stand", "🦵")
add_item("PT067", "SUB018", "น็อต", "Bolt", "🔩")
add_item("PT068", "SUB018", "สกรู", "Screw", "🔩")
add_item("PT069", "SUB018", "แหวนรอง", "Washer", "💍")
add_item("PT070", "SUB018", "กิ๊บล็อก", "Retaining Clip", "📎")
add_item("PT071", "SUB019", "ตะแกรงท้าย", "Rear Rack", "🛒")
add_item("PT072", "SUB019", "กล่องท้าย", "Top Box", "📦")
add_item("PT073", "SUB019", "กันล้ม", "Crash Bar", "🚧")

json_path = 'c:/Users/salan/Desktop/motorcycle-parts-shop/data/categories.json'
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Generated {len(data)} items to {json_path}")

# 2. ลบข้อมูลเก่าใน Database เพื่อให้ระบบ Seed ใหม่
sys.path.append('c:/Users/salan/Desktop/motorcycle-parts-shop/backend')
from app.database import engine
from app.models.category import Category
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)
session = Session()

# ลบข้อมูลตาราง categories
session.query(Category).delete()
session.commit()
print("Cleared old categories from database.")

