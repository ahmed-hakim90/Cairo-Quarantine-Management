#!/usr/bin/env python3
"""Generate Arabic RTL presentation PDF for Cairo Quarantine portal."""

from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class ZeroHeight(Flowable):
    """Placeholder so cover draws on page 1 without consuming layout space."""

    def wrap(self, avail_width, avail_height):
        return 0, 0

    def draw(self):
        pass

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT_PATH = DOCS / "Cairo-Quarantine-Presentation.pdf"
SHOTS = DOCS / "handover" / "screenshots"
FONT_PATH = Path("/Library/Fonts/Arial Unicode.ttf")
PAGE_SIZE = landscape(A4)
PAGE_W, PAGE_H = PAGE_SIZE

NAVY = colors.HexColor("#0B1F3A")
ACCENT = colors.HexColor("#C9A227")
LIGHT = colors.HexColor("#F4F6F8")
MID = colors.HexColor("#5A6B7D")
WHITE = colors.white


def ar(text: str) -> str:
    if not text:
        return ""
    return get_display(arabic_reshaper.reshape(text))


def register_font() -> str:
    name = "ArialUnicode"
    if FONT_PATH.is_file():
        pdfmetrics.registerFont(TTFont(name, str(FONT_PATH)))
        return name
    raise FileNotFoundError(f"Arabic font not found: {FONT_PATH}")


def build_styles(font: str) -> dict[str, ParagraphStyle]:
    base = dict(fontName=font, wordWrap="RTL")
    return {
        "title": ParagraphStyle(
            "title",
            **base,
            fontSize=28,
            leading=34,
            textColor=WHITE,
            alignment=TA_CENTER,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            **base,
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#D8E2F0"),
            alignment=TA_CENTER,
        ),
        "h1": ParagraphStyle(
            "h1",
            **base,
            fontSize=22,
            leading=28,
            textColor=NAVY,
            spaceAfter=10,
            alignment=TA_RIGHT,
        ),
        "h2": ParagraphStyle(
            "h2",
            **base,
            fontSize=16,
            leading=22,
            textColor=NAVY,
            spaceAfter=6,
            alignment=TA_RIGHT,
        ),
        "body": ParagraphStyle(
            "body",
            **base,
            fontSize=12,
            leading=18,
            textColor=colors.HexColor("#1A2B3C"),
            spaceAfter=4,
            alignment=TA_RIGHT,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            **base,
            fontSize=11,
            leading=16,
            leftIndent=12,
            bulletIndent=0,
            alignment=TA_RIGHT,
        ),
        "small": ParagraphStyle(
            "small",
            **base,
            fontSize=9,
            leading=13,
            textColor=MID,
            alignment=TA_RIGHT,
        ),
        "price": ParagraphStyle(
            "price",
            **base,
            fontSize=18,
            leading=24,
            textColor=NAVY,
            alignment=TA_CENTER,
        ),
    }


def slide_header(canvas, doc, title: str) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 2.2 * cm, PAGE_W, 2.2 * cm, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, PAGE_H - 2.25 * cm, PAGE_W, 3 * mm, fill=1, stroke=0)
    canvas.setFont("ArialUnicode", 16)
    canvas.setFillColor(WHITE)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 1.45 * cm, ar(title))
    canvas.setFont("ArialUnicode", 9)
    canvas.setFillColor(colors.HexColor("#A8B8CC"))
    canvas.drawCentredString(
        PAGE_W / 2,
        PAGE_H - 1.85 * cm,
        ar("بوابة إدارة الحجر الصحي بالقاهرة"),
    )
    canvas.restoreState()


def slide_footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont("ArialUnicode", 8)
    canvas.setFillColor(MID)
    page = canvas.getPageNumber()
    canvas.drawCentredString(PAGE_W / 2, 12 * mm, ar(f"— {page} —"))
    canvas.restoreState()


def on_page(canvas, doc) -> None:
    title = getattr(doc, "slide_title", "")
    if title:
        slide_header(canvas, doc, title)
    slide_footer(canvas, doc)


def cover_page(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, PAGE_H * 0.38, PAGE_W, 4 * mm, fill=1, stroke=0)

    canvas.setFont("ArialUnicode", 32)
    canvas.setFillColor(WHITE)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H * 0.58, ar("بوابة إدارة الحجر الصحي بالقاهرة"))

    canvas.setFont("ArialUnicode", 14)
    canvas.setFillColor(colors.HexColor("#B8C8DC"))
    canvas.drawCentredString(
        PAGE_W / 2,
        PAGE_H * 0.50,
        "Cairo Quarantine Administration Portal",
    )

    canvas.setFont("ArialUnicode", 13)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H * 0.42, ar("عرض فني وتجاري — تسليم النظام وخطة التطوير"))

    canvas.setFont("ArialUnicode", 11)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H * 0.28, ar("مايو 2026"))

    bullets = [
        "منصة ويب متعددة اللغات",
        "حجز مواعيد + بطاقة QR",
        "لوحة إدارة وتشغيل مكاتب",
        "طابور حضور يومي",
    ]
    y = PAGE_H * 0.18
    canvas.setFont("ArialUnicode", 10)
    for b in bullets:
        canvas.drawCentredString(PAGE_W / 2, y, ar(f"• {b}"))
        y -= 14

    canvas.restoreState()
    slide_footer(canvas, doc)


def p(styles, key: str, text: str) -> Paragraph:
    return Paragraph(ar(text), styles[key])


def bullets(styles, items: list[str]) -> list:
    flow = []
    for item in items:
        flow.append(p(styles, "bullet", f"• {item}"))
    return flow


def table_rtl(data: list[list[str]], col_widths: list[float]) -> Table:
    rows = [[ar(cell) for cell in row] for row in data]
    t = Table(rows, colWidths=col_widths, hAlign="RIGHT")
    t.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "ArialUnicode"),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#1A2B3C")),
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D0D8E0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return t


def screenshot_image(filename: str, max_w: float, max_h: float) -> Image | None:
    path = SHOTS / filename
    if not path.is_file():
        return None
    with PILImage.open(path) as im:
        w, h = im.size
    ratio = min(max_w / w, max_h / h)
    return Image(str(path), width=w * ratio, height=h * ratio)


class SlideDoc(SimpleDocTemplate):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.slide_title = ""

    def afterPage(self):
        self.slide_title = ""


def flatten_flowables(items: list) -> list:
    flat: list = []
    for item in items:
        if isinstance(item, list):
            flat.extend(flatten_flowables(item))
        elif item is not None:
            flat.append(item)
    return flat


def add_slide(
    story: list,
    doc: SlideDoc,
    title: str,
    content: list,
    *,
    page_break: bool = True,
) -> None:
    if page_break:
        story.append(PageBreak())
    doc.slide_title = title
    story.extend(flatten_flowables(content))
    story.append(Spacer(1, 0.3 * cm))


def build_story(styles: dict) -> list:
    story: list = []
    usable_w = PAGE_W - 3 * cm
    usable_h = PAGE_H - 4.5 * cm

    doc = SlideDoc(
        str(OUT_PATH),
        pagesize=PAGE_SIZE,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=3 * cm,
        bottomMargin=1.8 * cm,
    )

    story.append(ZeroHeight())
    story.append(PageBreak())

    add_slide(
        story,
        doc,
        "الملخص التنفيذي",
        [
            p(
                styles,
                "body",
                "منصة ويب حكومية متكاملة لإدارة الحجر الصحي بالقاهرة: إرشاد المسافرين والمواطنين، "
                "حجز مواعيد التطعيم إلكترونياً، استقبال الشكاوى، وتشغيل المكاتب عبر لوحة إدارة وطابور حضور.",
            ),
            Spacer(1, 0.4 * cm),
            table_rtl(
                [
                    ["المحور", "الوصف"],
                    ["الجمهور", "مسافرون، حجاج، مواطنون + موظفو مكاتب"],
                    ["اللغات", "عربي (افتراضي) · إنجليزي · صيني"],
                    ["قاعدة البيانات", "Firebase Firestore + Auth للإدارة"],
                    ["الصفحات", "24 صفحة · 17 API · 4 أدوار إدارية"],
                ],
                [usable_w * 0.28, usable_w * 0.72],
            ),
        ],
        page_break=False,
    )

    add_slide(
        story,
        doc,
        "مكونات النظام",
        bullets(
            styles,
            [
                "بوابة إرشادية: رئيسية، مسافر دولي، حج وعمرة، مواطن، ميثاق تطعيمات",
                "حجز موعد: حالة مسافر، مكتب، تاريخ، سعة يومية، QR + PNG",
                "شكوى ومقترح + متابعة «طلباتي» على الجهاز",
                "تسجيل حضور يومي وطابور انتظار بالمكتب",
                "لوحة إدارة: طلبات، إحصاءات، Excel، مكاتب، لقاحات، دول، مستخدمين",
                "PWA · قراءة نص · واتساب · أرشفة تلقائية",
            ],
        ),
    )

    img = screenshot_image("01-public-home-ar.png", usable_w * 0.55, usable_h * 0.55)
    content = [
        p(styles, "body", "واجهة عامة احترافية ثلاثية اللغات مع بطاقات خدمات وجداول لقاحات ومكاتب."),
    ]
    if img:
        content.extend([Spacer(1, 0.2 * cm), img])
    add_slide(story, doc, "الواجهة العامة", content)

    img = screenshot_image("03-public-booking-ar.png", usable_w * 0.5, usable_h * 0.5)
    content = [
        p(styles, "body", "مسار موحّد للحجز مع تحقق السعة اليومية وساعة قطع «نفس اليوم» (توقيت القاهرة)."),
        p(styles, "small", "بعد النجاح: رقم طلب + بطاقة QR صالحة 30 يوماً."),
    ]
    if img:
        content.extend([Spacer(1, 0.15 * cm), img])
    add_slide(story, doc, "حجز المواعيد والبطاقة الرقمية", content)

    img = screenshot_image("14-public-booking-pass-ar.png", usable_w * 0.42, usable_h * 0.48)
    content = [
        p(styles, "body", "بطاقة إلكترونية للعرض عند المكتب — مسح QR أو رابط سري."),
    ]
    if img:
        content.extend([Spacer(1, 0.15 * cm), img])
    add_slide(story, doc, "بطاقة الحجز (QR)", content)

    admin_img = screenshot_image(
        "11-admin-dashboard-ar.png", usable_w * 0.48, usable_h * 0.38
    )
    admin_slide = [
        p(styles, "body", "متابعة الطلبات، قوالب واتساب، تغيير الحالة، تصدير، إشعارات."),
        Spacer(1, 0.2 * cm),
    ]
    if admin_img:
        admin_slide.append(admin_img)
    add_slide(story, doc, "لوحة الإدارة", admin_slide)

    row_imgs = []
    for fn in ("12-admin-requests-ar.png", "19-admin-office-queue-ar.png"):
        im = screenshot_image(fn, usable_w * 0.42, usable_h * 0.35)
        if im:
            row_imgs.append(im)
    if len(row_imgs) == 2:
        t = Table([[row_imgs[1], row_imgs[0]]], colWidths=[usable_w * 0.48, usable_w * 0.48])
        add_slide(story, doc, "الطلبات والطابور", [t])
    else:
        add_slide(story, doc, "الطلبات والطابور", bullets(styles, ["قائمة طلبات بفلاتر", "طابور يومي لكل مكتب"]))

    add_slide(
        story,
        doc,
        "التقنيات",
        [
            table_rtl(
                [
                    ["الطبقة", "التقنية"],
                    ["Frontend", "Next.js 16 · React 19 · Tailwind 4"],
                    ["Backend", "Server Actions · 17 REST API"],
                    ["Data", "Firestore · Firebase Auth"],
                    ["جودة", "TypeScript · Vitest · توثيق Handover"],
                ],
                [usable_w * 0.35, usable_w * 0.65],
            ),
        ],
    )

    add_slide(
        story,
        doc,
        "الأدوار والأمان",
        [
            table_rtl(
                [
                    ["الدور", "الصلاحيات"],
                    ["سوبر أدمن", "كل المكاتب والكتالوجات والإعدادات"],
                    ["أدمن محافظة/مكاتب", "مكاتب مسموحة + مستخدمي مكتب"],
                    ["مستخدم مكتب", "طلبات مكتبه + الطابور"],
                ],
                [usable_w * 0.3, usable_w * 0.7],
            ),
            Spacer(1, 0.3 * cm),
            bullets(
                styles,
                [
                    "جلسة إدارة httpOnly · Rate limit · قواعد Firestore",
                    "لا إنشاء طلبات من متصفح الزائر مباشرة",
                ],
            ),
        ],
    )

    add_slide(
        story,
        doc,
        "عرض السعر — تسليم النظام",
        [
            p(styles, "h2", "الباقة القياسية (النظام كما هو — جاهز للتشغيل)"),
            Spacer(1, 0.2 * cm),
            table_rtl(
                [
                    ["البند", "التقدير (جنيه مصري)"],
                    ["تحليل وتصميم", "80,000 – 120,000"],
                    ["الواجهة العامة (3 لغات)", "150,000 – 220,000"],
                    ["الحجز والـ QR", "120,000 – 180,000"],
                    ["الشكاوى وطلباتي", "60,000 – 90,000"],
                    ["الطابور والحضور", "100,000 – 150,000"],
                    ["لوحة الإدارة", "180,000 – 260,000"],
                    ["Firebase والأمان", "80,000 – 120,000"],
                    ["اختبار وتوثيق", "50,000 – 80,000"],
                    ["الإجمالي المقترح", "950,000 – 1,100,000"],
                ],
                [usable_w * 0.55, usable_w * 0.45],
            ),
            Spacer(1, 0.2 * cm),
            p(styles, "small", "* الأسعار تقديرية — تُخصص حسب العقد والضريبة والتدريب."),
        ],
    )

    add_slide(
        story,
        doc,
        "التشغيل والصيانة (سنوياً)",
        [
            table_rtl(
                [
                    ["البند", "تقدير سنوي (جنيه)"],
                    ["استضافة + نطاق", "15,000 – 40,000"],
                    ["Firebase (حسب الاستخدام)", "20,000 – 80,000"],
                    ["مراقبة ونسخ احتياطي", "25,000 – 50,000"],
                    ["دعم فني", "120,000 – 240,000"],
                    ["إجمالي تشغيل", "180,000 – 410,000"],
                ],
                [usable_w * 0.55, usable_w * 0.45],
            ),
            Spacer(1, 0.3 * cm),
            p(styles, "body", "صيانة شهرية اختيارية: 15,000 – 35,000 جنيه + ساعات تطوير حسب الأولوية."),
        ],
    )

    add_slide(
        story,
        doc,
        "خارطة التطوير المستقبلية",
        [
            table_rtl(
                [
                    ["المرحلة", "أمثلة", "تقدير"],
                    ["2 — تشغيل", "OTP · SMS/WhatsApp آلي · CMS", "360,000 – 780,000"],
                    ["3 — تكامل", "رقم قومي · دفع · تطبيق جوال", "620,000 – 1,400,000"],
                    ["4 — مكاتب", "مخزون لقاحات · Kiosk · شاشة انتظار", "440,000 – 790,000"],
                    ["5 — ذكاء", "مساعد ذكي · إتاحة معتمدة", "230,000 – 530,000"],
                ],
                [usable_w * 0.22, usable_w * 0.48, usable_w * 0.3],
            ),
        ],
    )

    add_slide(
        story,
        doc,
        "التسليم والخطوة التالية",
        bullets(
            styles,
            [
                "تسليم الكود + Firebase rules + مستند Handover (MD/Word)",
                "25 لقطة شاشة + تدريب تشغيل 1–2 يوم",
                "نشر إنتاج + Cron أرشفة + أول سوبر أدمن",
                "صلاحية العرض: 30 يوماً",
            ],
        )
        + [
            Spacer(1, 1.2 * cm),
            p(styles, "h2", "شكراً لكم"),
            p(styles, "body", "[اسم الشركة / الجهة المنفذة] · [البريد] · [الهاتف]"),
            p(styles, "small", "Cairo Quarantine Administration · mayo 2026"),
        ],
        page_break=False,
    )

    return story, doc


def main() -> int:
    register_font()
    styles = build_styles("ArialUnicode")
    story, doc = build_story(styles)

    def first_page(canvas, d):
        cover_page(canvas, d)

    def later_pages(canvas, d):
        on_page(canvas, d)

    doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
