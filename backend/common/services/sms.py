class SMSService:
    def send(self, *, phone: str, message: str) -> bool:
        return bool(phone and message)
