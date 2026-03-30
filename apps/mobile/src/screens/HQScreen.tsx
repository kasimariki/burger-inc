import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  fetchHQ,
  createDepartment,
  hireExecutive,
  type Department,
  type Executive,
} from "../services/api";
import { C } from "../theme";

const USER_ID = "user-001";

const DEPT_INFO: Record<string, { label: string; icon: string; desc: string; setupCost: number }> = {
  operations: { label: "Operations", icon: "OPS", desc: "Store efficiency & logistics", setupCost: 5000 },
  marketing:  { label: "Marketing",  icon: "MKT", desc: "Brand building & campaigns", setupCost: 8000 },
  finance:    { label: "Finance",    icon: "FIN", desc: "Cost control & reporting", setupCost: 6000 },
  rd:         { label: "R&D",        icon: "R&D", desc: "Menu innovation & quality", setupCost: 10000 },
};

const EXEC_INFO: Record<string, { label: string; dept: string; desc: string; baseSalary: number }> = {
  coo: { label: "COO", dept: "operations", desc: "Oversees daily operations", baseSalary: 3000 },
  cmo: { label: "CMO", dept: "marketing",  desc: "Drives brand & marketing", baseSalary: 3500 },
  cfo: { label: "CFO", dept: "finance",    desc: "Financial strategy", baseSalary: 3200 },
  cto: { label: "CTO", dept: "rd",         desc: "Tech & innovation lead", baseSalary: 4000 },
};

export default function HQScreen() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"org" | "hire">("org");
  const [execName, setExecName] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const data = await fetchHQ(USER_ID);
    setDepartments(data.departments ?? []);
    setExecutives(data.executives ?? []);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const existingDepts = new Set(departments.map(d => d.department));
  const existingExecs = new Set(executives.map(e => e.role));

  const handleCreateDept = async (key: string) => {
    const info = DEPT_INFO[key];
    Alert.alert(
      `Establish ${info.label}?`,
      `Setup cost: $${info.setupCost.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Establish", onPress: async () => {
          await createDepartment(USER_ID, key);
          await reload();
        }},
      ]
    );
  };

  const handleHireExec = async () => {
    if (!selectedRole || !execName.trim()) {
      Alert.alert("Error", "Select a role and enter a name.");
      return;
    }
    const info = EXEC_INFO[selectedRole];
    await hireExecutive(USER_ID, selectedRole, execName.trim(), info.baseSalary);
    setExecName("");
    setSelectedRole(null);
    await reload();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  const monthlyCost = executives.reduce((sum, e) => sum + e.salary, 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{departments.length}</Text>
            <Text style={styles.summaryLabel}>Departments</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{executives.length}</Text>
            <Text style={styles.summaryLabel}>Executives</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: C.red }]}>${monthlyCost.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Monthly Cost</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.segmentRow}>
        {(["org", "hire"] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.segmentBtn, tab === t && styles.segmentActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
              {t === "org" ? "Organization" : "Hire Executive"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Org tab */}
      {tab === "org" && (
        <>
          <Text style={styles.sectionLabel}>DEPARTMENTS</Text>
          {Object.entries(DEPT_INFO).map(([key, info]) => {
            const exists = existingDepts.has(key);
            const dept = departments.find(d => d.department === key);
            const exec = executives.find(e => EXEC_INFO[e.role]?.dept === key);

            return (
              <View key={key} style={[styles.card, exists && { borderColor: C.teal + "40" }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, exists && { backgroundColor: C.teal }]}>
                    <Text style={styles.iconText}>{info.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{info.label}</Text>
                    <Text style={styles.cardSub}>{info.desc}</Text>
                  </View>
                  {exists && dept && (
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>Lv.{dept.level}</Text>
                    </View>
                  )}
                </View>

                {exists && dept && (
                  <View style={styles.deptStats}>
                    <View style={styles.deptStat}>
                      <Text style={styles.deptStatNum}>{dept.staffCount}</Text>
                      <Text style={styles.deptStatLabel}>Staff</Text>
                    </View>
                    <View style={styles.deptStat}>
                      <Text style={styles.deptStatNum}>{dept.efficiency}%</Text>
                      <Text style={styles.deptStatLabel}>Efficiency</Text>
                    </View>
                    {exec && (
                      <View style={styles.deptStat}>
                        <Text style={styles.deptStatNum}>{exec.name}</Text>
                        <Text style={styles.deptStatLabel}>{EXEC_INFO[exec.role]?.label}</Text>
                      </View>
                    )}
                  </View>
                )}

                {!exists && (
                  <TouchableOpacity style={styles.establishBtn} onPress={() => handleCreateDept(key)}>
                    <Text style={styles.establishBtnText}>
                      ESTABLISH — ${info.setupCost.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Hire tab */}
      {tab === "hire" && (
        <>
          <Text style={styles.sectionLabel}>SELECT ROLE</Text>
          <View style={styles.roleGrid}>
            {Object.entries(EXEC_INFO).map(([key, info]) => {
              const hired = existingExecs.has(key);
              const hasDept = existingDepts.has(info.dept);
              const selected = selectedRole === key;

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.roleCard,
                    selected && { borderColor: C.accent, backgroundColor: C.accent + "15" },
                    hired && { opacity: 0.4 },
                  ]}
                  onPress={() => !hired && hasDept && setSelectedRole(key)}
                  disabled={hired || !hasDept}
                >
                  <Text style={[styles.roleTitle, selected && { color: C.accent }]}>{info.label}</Text>
                  <Text style={styles.roleSub}>{info.desc}</Text>
                  <Text style={styles.roleSalary}>${info.baseSalary.toLocaleString()}/w</Text>
                  {hired && <Text style={styles.roleHired}>HIRED</Text>}
                  {!hasDept && !hired && <Text style={styles.roleNoDept}>Need {DEPT_INFO[info.dept]?.label}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedRole && (
            <View style={styles.hireForm}>
              <Text style={styles.sectionLabel}>EXECUTIVE NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name..."
                placeholderTextColor={C.textMuted}
                value={execName}
                onChangeText={setExecName}
              />
              <TouchableOpacity style={styles.hireBtn} onPress={handleHireExec}>
                <Text style={styles.hireBtnText}>
                  HIRE {EXEC_INFO[selectedRole]?.label} — ${EXEC_INFO[selectedRole]?.baseSalary.toLocaleString()}/week
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  summaryCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  summaryRow: { flexDirection: "row" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, backgroundColor: C.border },
  summaryNum: { fontSize: 20, fontWeight: "900", color: C.text },
  summaryLabel: { fontSize: 9, color: C.textMuted, fontWeight: "600", letterSpacing: 1, marginTop: 2, textTransform: "uppercase" },

  segmentRow: { flexDirection: "row", backgroundColor: C.card, borderRadius: 10, padding: 3, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: C.amber },
  segmentText: { color: C.textMuted, fontSize: 12, fontWeight: "700" },
  segmentTextActive: { color: "#fff", fontSize: 12, fontWeight: "700" },

  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },

  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  iconText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: "800" },
  cardSub: { color: C.textDim, fontSize: 11, marginTop: 2 },

  levelBadge: { backgroundColor: C.teal + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  levelText: { color: C.teal, fontSize: 12, fontWeight: "800" },

  deptStats: { flexDirection: "row", marginTop: 12, gap: 8 },
  deptStat: { flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 10, alignItems: "center" },
  deptStatNum: { color: C.text, fontSize: 14, fontWeight: "800" },
  deptStatLabel: { color: C.textMuted, fontSize: 9, fontWeight: "600", marginTop: 2 },

  establishBtn: { backgroundColor: C.amber, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  establishBtnText: { color: "#fff", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },

  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleCard: { width: "48%" as any, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  roleTitle: { color: C.text, fontSize: 18, fontWeight: "900" },
  roleSub: { color: C.textDim, fontSize: 10, marginTop: 4 },
  roleSalary: { color: C.amber, fontSize: 12, fontWeight: "700", marginTop: 6 },
  roleHired: { color: C.green, fontSize: 10, fontWeight: "700", marginTop: 4 },
  roleNoDept: { color: C.red, fontSize: 9, fontWeight: "600", marginTop: 4 },

  hireForm: { marginTop: 16 },
  input: { backgroundColor: C.card, borderRadius: 10, padding: 14, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  hireBtn: { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  hireBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
});
