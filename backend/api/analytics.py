from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from modules.progress_tracker import get_dashboard_stats
from modules.report_generator import generate_performance_report
import io

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard/{user_id}")
def get_dashboard(user_id: int):
    try:
        stats = get_dashboard_stats(user_id)
        return {"stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")

@router.get("/export-pdf/{user_id}/{user_name}")
def export_pdf(user_id: int, user_name: str):
    try:
        stats = get_dashboard_stats(user_id)
        pdf_bytes = generate_performance_report(user_name, stats)
        
        if not pdf_bytes:
            raise HTTPException(status_code=500, detail="Could not generate PDF report.")
            
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=edusathi_report_{user_id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
