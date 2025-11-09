from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from uuid import UUID

from app.core.database import get_db
from app.models import Farmer, Farm, ChatLog, LanguageEnum
from app.schemas import ChatQuestion, ChatResponse, ChatHistory
from app.api.endpoints.auth import get_current_active_farmer
from app.services.ai_service import ai_recommendation_service
from app.services.weather_service import weather_service

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
async def ask_question(
    chat_request: ChatQuestion,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Ask a question to the AI agricultural advisor"""
    
    # Prepare farmer data for AI context
    farmer_data = {
        "name": current_farmer.name,
        "language_preference": current_farmer.language_preference.value,
        "id": str(current_farmer.id)
    }
    
    # Prepare context data if requested
    context_data = {}
    if chat_request.include_farm_context:
        # Get farmer's farms
        farms = db.query(Farm).filter(Farm.farmer_id == current_farmer.id).all()
        if farms:
            context_data["farms"] = [
                {
                    "crop_type": farm.crop_type,
                    "land_size": farm.land_size,
                    "soil_type": farm.soil_type,
                    "latitude": farm.latitude,
                    "longitude": farm.longitude
                }
                for farm in farms
            ]
            
            # Get weather for the first farm
            first_farm = farms[0]
            try:
                weather = await weather_service.get_current_weather(
                    first_farm.latitude, 
                    first_farm.longitude
                )
                if weather:
                    context_data["weather"] = {
                        "temperature": weather.temperature,
                        "humidity": weather.humidity,
                        "precipitation": weather.precipitation,
                        "description": weather.description
                    }
            except Exception as e:
                print(f"Weather fetch error for chat: {e}")
    
    try:
        # Generate AI response
        ai_response = await ai_recommendation_service.generate_chat_response(
            chat_request.question,
            farmer_data,
            context_data
        )
        
        # Store the conversation in database
        chat_log = ChatLog(
            farmer_id=current_farmer.id,
            question=chat_request.question,
            response=ai_response,
            context_data=json.dumps(context_data) if context_data else None,
            language=current_farmer.language_preference
        )
        
        db.add(chat_log)
        db.commit()
        db.refresh(chat_log)
        
        return ChatResponse.model_validate(chat_log)
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate response"
        )


@router.get("/history", response_model=ChatHistory)
def get_chat_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Get chat history for the current farmer"""
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Get total count
    total = db.query(ChatLog).filter(ChatLog.farmer_id == current_farmer.id).count()
    
    # Get chat logs
    chat_logs = (
        db.query(ChatLog)
        .filter(ChatLog.farmer_id == current_farmer.id)
        .order_by(ChatLog.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )
    
    # Convert to response models
    chat_responses = [ChatResponse.model_validate(log) for log in chat_logs]
    
    return ChatHistory(
        chat_logs=chat_responses,
        total=total,
        page=page,
        per_page=per_page
    )


@router.delete("/history/{chat_id}")
def delete_chat_message(
    chat_id: UUID,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Delete a specific chat message"""
    
    chat_log = db.query(ChatLog).filter(
        ChatLog.id == chat_id,
        ChatLog.farmer_id == current_farmer.id
    ).first()
    
    if not chat_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat message not found"
        )
    
    db.delete(chat_log)
    db.commit()
    
    return {"message": "Chat message deleted successfully"}


@router.delete("/history")
def clear_chat_history(
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Clear all chat history for the current farmer"""
    
    deleted_count = db.query(ChatLog).filter(
        ChatLog.farmer_id == current_farmer.id
    ).delete()
    
    db.commit()
    
    return {"message": f"Deleted {deleted_count} chat messages"}


@router.get("/suggestions")
def get_chat_suggestions(
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Get suggested questions for farmers"""
    
    language = current_farmer.language_preference
    
    suggestions = {
        LanguageEnum.ENGLISH: [
            "How often should I water my tomatoes?",
            "What are the best organic fertilizers for vegetables?",
            "How can I protect my crops from pests naturally?",
            "When is the best time to plant maize in this season?",
            "How do I know if my soil is healthy?",
            "What crops grow well together?",
            "How can I save water while irrigating?",
            "What should I do if my plants have yellow leaves?"
        ],
        LanguageEnum.SWAHILI: [
            "Ni mara ngapi nimwagilie nyanya zangu?",
            "Ni mbolea gani bora za asili kwa mboga?",
            "Ninawezaje kulinda mazao yangu dhidi ya wadudu kwa njia ya asili?",
            "Ni wakati gani bora wa kupanda mahindi katika msimu huu?",
            "Nitajuaje kama ardhi yangu ni mizuri?",
            "Ni mazao gani yanayokua vizuri pamoja?",
            "Ninawezaje kuokoa maji wakati wa umwagiliaji?",
            "Nifanye nini ikiwa mimea yangu ina majani ya manjano?"
        ],
        LanguageEnum.KINYARWANDA: [
            "Ni kangahe nkwiye guhira amatamatisi yanjye?",
            "Ni ifumbire rizihe nziza z'ibimera ku mboga?",
            "Nshobora gute kurinda ibihingwa byanjye ku bukoko mu buryo busanzwe?",
            "Ni ryari igihe cyiza cyo gutera ibigori muri iki gihe?",
            "Nzamenya nte niba ubutaka bwanjye bwiza?",
            "Ni ibihingwa bizihe bikura neza hamwe?",
            "Nshobora gute kubika amazi mu gihe cyo guhira?",
            "Nkore iki niba ibimera byanjye bifite amababi y'umuhondo?"
        ]
    }
    
    return {
        "suggestions": suggestions.get(language, suggestions[LanguageEnum.ENGLISH])
    }


@router.post("/sms-webhook")
async def handle_incoming_sms(
    phone_number: str,
    message: str,
    db: Session = Depends(get_db)
):
    """Handle incoming SMS messages for chat functionality"""
    from app.services.notification_service import notification_service
    
    try:
        # Process the SMS as a chat message
        response = await notification_service.process_sms_chat_message(
            phone_number, message, db
        )
        
        # Send response back via SMS
        await notification_service.send_sms(phone_number, response, LanguageEnum.ENGLISH)
        
        return {"message": "SMS processed and response sent"}
        
    except Exception as e:
        print(f"SMS webhook error: {e}")
        return {"message": "Error processing SMS"}


@router.get("/stats")
async def get_chat_stats(
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Get chat usage statistics for the farmer"""
    
    total_messages = db.query(ChatLog).filter(
        ChatLog.farmer_id == current_farmer.id
    ).count()
    
    # Get messages in the last 30 days
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_messages = db.query(ChatLog).filter(
        ChatLog.farmer_id == current_farmer.id,
        ChatLog.created_at >= thirty_days_ago
    ).count()
    
    # Most recent message
    latest_chat = db.query(ChatLog).filter(
        ChatLog.farmer_id == current_farmer.id
    ).order_by(ChatLog.created_at.desc()).first()
    
    return {
        "total_conversations": total_messages,
        "recent_conversations": recent_messages,
        "last_conversation": latest_chat.created_at if latest_chat else None
    }
