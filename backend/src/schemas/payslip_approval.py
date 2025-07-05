from pydantic import BaseModel

class PayslipApprovalRequest(BaseModel):
    approver_id: int
