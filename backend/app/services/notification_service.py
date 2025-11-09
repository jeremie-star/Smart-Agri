import smtplib
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict
from twilio.rest import Client as TwilioClient
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import settings
from app.models import LanguageEnum, NotificationChannelEnum


class NotificationService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        
        # SMS services
        self.africas_talking_api_key = settings.africas_talking_api_key
        self.africas_talking_username = settings.africas_talking_username
        self.twilio_account_sid = settings.twilio_account_sid
        self.twilio_auth_token = settings.twilio_auth_token
        self.twilio_phone_number = settings.twilio_phone_number
        
        # SendGrid
        self.sendgrid_api_key = settings.sendgrid_api_key
        self.sendgrid_from_email = settings.sendgrid_from_email
        
        # Initialize Twilio client if credentials available
        self.twilio_client = None
        if self.twilio_account_sid and self.twilio_auth_token:
            self.twilio_client = TwilioClient(self.twilio_account_sid, self.twilio_auth_token)
    
    def _translate_message(self, message: str, language: LanguageEnum) -> str:
        """Translate message based on language preference"""
        translations = {
            LanguageEnum.SWAHILI: {
                "Irrigation Reminder": "Kikumbusho cha Umwagiliaji",
                "It's time to water your": "Ni wakati wa kumwagilia",
                "crop": "mazao",
                "with": "na",
                "liters of water": "lita za maji",
                "Weather conditions": "Hali ya hewa",
                "Reason": "Sababu"
            },
            LanguageEnum.KINYARWANDA: {
                "Irrigation Reminder": "Kwibutsa Kuhira",
                "It's time to water your": "Ni igihe cyo guhira",
                "crop": "igihingwa",
                "with": "na",
                "liters of water": "litiro z'amazi",
                "Weather conditions": "Ikirere",
                "Reason": "Impamvu"
            }
        }
        
        if language == LanguageEnum.ENGLISH:
            return message
        
        # Simple translation replacement
        translated = message
        lang_dict = translations.get(language, {})
        for english, translation in lang_dict.items():
            translated = translated.replace(english, translation)
        
        return translated
    
    def _format_sms_message(self, message: str) -> str:
        """Format message to fit SMS 160-character limit"""
        if len(message) <= 160:
            return message
        
        # Truncate and add ellipsis
        return message[:157] + "..."
    
    async def send_sms_africas_talking(self, phone_number: str, message: str) -> bool:
        """Send SMS via Africa's Talking"""
        if not self.africas_talking_api_key or not self.africas_talking_username:
            return False
        
        try:
            url = "https://api.africastalking.com/version1/messaging"
            headers = {
                "ApiKey": self.africas_talking_api_key,
                "Content-Type": "application/x-www-form-urlencoded"
            }
            data = {
                "username": self.africas_talking_username,
                "to": phone_number,
                "message": message
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, data=data)
                response.raise_for_status()
                
                result = response.json()
                return result.get("SMSMessageData", {}).get("Recipients", [{}])[0].get("status") == "Success"
        
        except Exception as e:
            print(f"Africa's Talking SMS error: {e}")
            return False
    
    async def send_sms_twilio(self, phone_number: str, message: str) -> bool:
        """Send SMS via Twilio (fallback)"""
        if not self.twilio_client or not self.twilio_phone_number:
            return False
        
        try:
            message_obj = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_phone_number,
                to=phone_number
            )
            return message_obj.status in ["sent", "queued"]
        
        except Exception as e:
            print(f"Twilio SMS error: {e}")
            return False
    
    async def send_sms(self, phone_number: str, message: str, language: LanguageEnum = LanguageEnum.ENGLISH) -> bool:
        """Send SMS with fallback providers"""
        # Translate and format message
        translated_message = self._translate_message(message, language)
        formatted_message = self._format_sms_message(translated_message)
        
        # Try Africa's Talking first
        success = await self.send_sms_africas_talking(phone_number, formatted_message)
        
        # Fallback to Twilio
        if not success:
            success = await self.send_sms_twilio(phone_number, formatted_message)
        
        return success
    
    async def send_email_smtp(self, email: str, subject: str, message: str) -> bool:
        """Send email via SMTP"""
        if not self.smtp_user or not self.smtp_password:
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(message, 'plain'))
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.smtp_user, email, text)
            server.quit()
            
            return True
        
        except Exception as e:
            print(f"SMTP email error: {e}")
            return False
    
    async def send_email_sendgrid(self, email: str, subject: str, message: str) -> bool:
        """Send email via SendGrid"""
        if not self.sendgrid_api_key or not self.sendgrid_from_email:
            return False
        
        try:
            sg = SendGridAPIClient(api_key=self.sendgrid_api_key)
            mail = Mail(
                from_email=self.sendgrid_from_email,
                to_emails=email,
                subject=subject,
                html_content=message
            )
            
            response = sg.send(mail)
            return response.status_code == 202
        
        except Exception as e:
            print(f"SendGrid email error: {e}")
            return False
    
    async def send_email(self, email: str, subject: str, message: str, language: LanguageEnum = LanguageEnum.ENGLISH) -> bool:
        """Send email with fallback providers"""
        # Translate message
        translated_message = self._translate_message(message, language)
        translated_subject = self._translate_message(subject, language)
        
        # Try SendGrid first
        success = await self.send_email_sendgrid(email, translated_subject, translated_message)
        
        # Fallback to SMTP
        if not success:
            success = await self.send_email_smtp(email, translated_subject, translated_message)
        
        return success
    
    async def process_sms_chat_message(self, phone_number: str, message: str, db) -> str:
        """Process incoming SMS as a chat message and return AI response"""
        from app.models import Farmer, ChatLog
        from app.services.ai_service import ai_recommendation_service
        import json
        
        # Find farmer by phone number
        farmer = db.query(Farmer).filter(Farmer.phone_number == phone_number).first()
        if not farmer:
            return self.translate_message(
                "Please register first by texting 'REGISTER' to get started with Smart Irrigation Assistant.",
                LanguageEnum.ENGLISH
            )
        
        # Check for special commands
        message_lower = message.lower().strip()
        
        if message_lower in ['help', 'msaada', 'ubufasha']:
            return self.translate_message(
                "Welcome to Smart Irrigation Assistant! Ask me questions about farming, irrigation, crops, or soil. Examples: 'How often should I water tomatoes?' or 'Best fertilizer for vegetables?'",
                farmer.language_preference
            )
        
        if message_lower in ['history', 'historia', 'amateka']:
            # Get recent chat history
            recent_chats = db.query(ChatLog).filter(
                ChatLog.farmer_id == farmer.id
            ).order_by(ChatLog.created_at.desc()).limit(3).all()
            
            if not recent_chats:
                return self.translate_message("No recent conversations found.", farmer.language_preference)
            
            history_text = "Recent conversations:\n"
            for chat in reversed(recent_chats):
                history_text += f"Q: {chat.question[:50]}...\n"
                history_text += f"A: {chat.response[:100]}...\n\n"
            
            return history_text[:160]  # SMS character limit
        
        # Process as regular chat question
        farmer_data = {
            "name": farmer.name,
            "language_preference": farmer.language_preference.value,
            "id": str(farmer.id)
        }
        
        try:
            # Generate AI response
            ai_response = await ai_recommendation_service.generate_chat_response(
                message, farmer_data
            )
            
            # Store conversation
            chat_log = ChatLog(
                farmer_id=farmer.id,
                question=message,
                response=ai_response,
                language=farmer.language_preference
            )
            db.add(chat_log)
            db.commit()
            
            # Format for SMS (limit to 160 characters)
            if len(ai_response) > 160:
                ai_response = ai_response[:157] + "..."
            
            return ai_response
            
        except Exception as e:
            print(f"SMS Chat processing error: {e}")
            return self.translate_message(
                "Sorry, I couldn't process your question right now. Please try again later.",
                farmer.language_preference
            )
    
    def create_irrigation_message(self, crop_type: str, water_amount: float, weather_condition: str, reasoning: str) -> str:
        """Create irrigation reminder message"""
        message = f"Irrigation Reminder: It's time to water your {crop_type} crop with {water_amount:.0f} liters of water. Weather conditions: {weather_condition}. Reason: {reasoning}"
        return message
    
    def create_irrigation_email_html(self, farmer_name: str, crop_type: str, water_amount: float, 
                                   weather_condition: str, reasoning: str, farm_location: str) -> str:
        """Create HTML email for irrigation reminder"""
        html = f"""
        <html>
        <body>
            <h2>🌱 Smart Irrigation Reminder</h2>
            <p>Dear {farmer_name},</p>
            
            <p>It's time to irrigate your <strong>{crop_type}</strong> crop!</p>
            
            <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>Irrigation Details:</h3>
                <ul>
                    <li><strong>Water Amount:</strong> {water_amount:.0f} liters</li>
                    <li><strong>Weather Conditions:</strong> {weather_condition}</li>
                    <li><strong>Farm Location:</strong> {farm_location}</li>
                </ul>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>Why Now?</h3>
                <p>{reasoning}</p>
            </div>
            
            <p>Best regards,<br>Smart Irrigation Assistant Team</p>
            
            <hr>
            <small>This is an automated message from Smart Irrigation Assistant.</small>
        </body>
        </html>
        """
        return html


# Singleton instance
notification_service = NotificationService()
