"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Phone,
  MapPin,
  Heart,
  Baby,
  UserCheck,
  AlertCircle,
  Calendar,
  CreditCard,
} from "lucide-react";
import {
  getEmergencyContacts,
  getDependents,
} from "@/app/(protected)/employees/actions";
import Loading from "@/app/(protected)/loading";

interface Props {
  employeeId: string;
}

export function FamilyTab({ employeeId }: Props) {
  const { data: emergencyContacts = [], isLoading: loadingContacts } = useQuery(
    {
      queryKey: ["emergencyContacts", employeeId],
      queryFn: () => getEmergencyContacts(employeeId),
    },
  );

  const { data: dependents = [], isLoading: loadingDependents } = useQuery({
    queryKey: ["dependents", employeeId],
    queryFn: () => getDependents(employeeId),
  });

  const isLoading = loadingContacts || loadingDependents;

  const getRelationshipIcon = (rel: string) => {
    switch (rel) {
      case "SPOUSE":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "CHILD":
        return <Baby className="h-4 w-4 text-blue-500" />;
      case "PARENT":
        return <UserCheck className="h-4 w-4 text-amber-500" />;
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRelationshipLabel = (rel: string) => {
    switch (rel) {
      case "SPOUSE":
        return "Vợ/Chồng";
      case "CHILD":
        return "Con cái";
      case "PARENT":
        return "Bố/Mẹ";
      default:
        return rel;
    }
  };

  const getRelationshipColor = (rel: string) => {
    switch (rel) {
      case "SPOUSE":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
      case "CHILD":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "PARENT":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {dependents.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Người phụ thuộc
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {emergencyContacts.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Liên hệ khẩn cấp
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {dependents.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Giảm trừ gia cảnh
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Người phụ thuộc */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Người phụ thuộc (Giảm trừ gia cảnh)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dependents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dependents.map((dep) => (
                  <div
                    key={dep.id}
                    className="group p-4 rounded-xl border hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {getRelationshipIcon(dep.relationship)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">
                            {dep.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${getRelationshipColor(dep.relationship)}`}
                          >
                            {getRelationshipLabel(dep.relationship)}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {dep.dateOfBirth && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Sinh:{" "}
                                {new Date(dep.dateOfBirth).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            </div>
                          )}
                          {dep.nationalId && (
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="h-3 w-3" />
                              <span className="font-mono text-xs">
                                CCCD: {dep.nationalId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Chưa có thông tin người phụ thuộc.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liên hệ khẩn cấp */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Liên hệ khẩn cấp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emergencyContacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="group p-4 rounded-xl border hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">
                            {contact.name}
                          </h4>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {contact.relationship}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <a
                              href={`tel:${contact.phone}`}
                              className="hover:underline hover:text-foreground transition-colors"
                            >
                              {contact.phone}
                            </a>
                          </div>
                          {contact.address && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">
                                {contact.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Chưa có thông tin liên hệ khẩn cấp.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
