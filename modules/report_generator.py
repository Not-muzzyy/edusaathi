"""modules/report_generator.py — PDF report with ReportLab."""
import io
from datetime import datetime


def generate_performance_report(user_name: str, stats: dict) -> bytes:
    """Generate PDF performance report. Returns bytes."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.units import cm

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
                                 rightMargin=2*cm, leftMargin=2*cm,
                                 topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        story = []

        title_style = ParagraphStyle("title", parent=styles["Title"],
                                     fontSize=22, textColor=colors.HexColor("#6C63FF"))
        story.append(Paragraph("EduSathi — Performance Report", title_style))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph(f"Student: {user_name}", styles["Normal"]))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("Summary", styles["Heading2"]))
        summary_data = [
            ["Metric", "Value"],
            ["Total Quizzes Taken", str(stats.get("total_quizzes", 0))],
            ["Average Score", f"{stats.get('avg_score_pct', 0)}%"],
            ["Overall Mastery", f"{stats.get('overall_mastery', 0)}%"],
            ["Weak Topics", str(len(stats.get("weak_topics", [])))],
            ["Strong Topics", str(len(stats.get("strong_topics", [])))],
        ]
        t = Table(summary_data, colWidths=[8*cm, 6*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#6C63FF")),
            ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("GRID",       (0,0), (-1,-1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.whitesmoke, colors.white]),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.5*cm))

        progress = stats.get("progress", [])
        if progress:
            story.append(Paragraph("Topic-wise Mastery", styles["Heading2"]))
            tp_data = [["Subject", "Topic", "Mastery Score"]]
            for p in progress:
                tp_data.append([p["subject"], p["topic"], f"{round(p['mastery_score']*100,1)}%"])
            t2 = Table(tp_data, colWidths=[5*cm, 7*cm, 4*cm])
            t2.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1A1A2E")),
                ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
                ("GRID",       (0,0), (-1,-1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.whitesmoke, colors.white]),
            ]))
            story.append(t2)
            story.append(Spacer(1, 0.5*cm))

        history = stats.get("history", [])[:10]
        if history:
            story.append(Paragraph("Recent Quiz History", styles["Heading2"]))
            h_data = [["Date", "Subject", "Topic", "Score", "Difficulty"]]
            for h in history:
                h_data.append([
                    str(h.get("attempted_at", ""))[:10],
                    h.get("subject", ""), h.get("topic", ""),
                    f"{h['score']}/{h['total_questions']}",
                    h.get("difficulty_level", "")
                ])
            t3 = Table(h_data, colWidths=[3*cm, 3*cm, 4*cm, 2*cm, 3*cm])
            t3.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#6C63FF")),
                ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
                ("GRID",       (0,0), (-1,-1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.whitesmoke, colors.white]),
                ("FONTSIZE",   (0,0), (-1,-1), 8),
            ]))
            story.append(t3)

        doc.build(story)
        return buf.getvalue()
    except Exception as e:
        return b""
