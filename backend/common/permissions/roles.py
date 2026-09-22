from rest_framework.permissions import BasePermission


class RolePermission(BasePermission):
    allowed_roles: tuple[str, ...] = tuple()

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) in self.allowed_roles
        )


class IsStudent(RolePermission):
    allowed_roles = ("student",)


class IsConsultant(RolePermission):
    allowed_roles = ("consultant",)


class IsAgency(RolePermission):
    allowed_roles = ("agency",)


class IsStudentConsultantOrAgency(RolePermission):
    allowed_roles = ("student", "consultant", "agency")


class IsAdmin(RolePermission):
    allowed_roles = ("admin",)
