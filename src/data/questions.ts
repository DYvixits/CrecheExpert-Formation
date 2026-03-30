export interface Question {
  id: string
  category: 'hygiene' | 'safety' | 'staffing' | 'educational' | 'administrative'
  text: string
  helpText?: string
  options: {
    label: string
    value: string
    isCompliant: boolean
    remediation?: string
  }[]
  dependsOn?: {
    questionId: string
    value: string
  }
}

export const diagnosticQuestions: Question[] = [
  {
    id: 'staff_ratio',
    category: 'staffing',
    text: "Le taux d'encadrement respecte-t-il la réglementation 2026 (1 professionnel pour 5 ou 6 enfants selon l'âge) ?",
    helpText: "Consultez le décret n° 2021-1131 pour plus de détails.",
    options: [
      { label: "Oui, parfaitement conforme", value: "yes", isCompliant: true },
      { label: "Partiellement (périodes de pointe critiques)", value: "partial", isCompliant: false, remediation: "Prévoyez un renfort de personnel sur les plages horaires identifiées." },
      { label: "Non conforme", value: "no", isCompliant: false, remediation: "Recrutement immédiat ou réduction de la capacité d'accueil nécessaire." }
    ]
  },
  {
    id: 'first_aid_cert',
    category: 'safety',
    text: "Tous les salariés présents ont-ils une certification de secourisme PSC1 de moins de 2 ans ?",
    options: [
      { label: "Oui, à 100%", value: "yes", isCompliant: true },
      { label: "Plus de 80% de l'équipe", value: "mostly", isCompliant: false, remediation: "Planifiez une session de recyclage pour les salariés restants." },
      { label: "Non, moins de 80%", value: "no", isCompliant: false, remediation: "Formation PSC1 obligatoire et urgente pour l'ensemble de l'équipe." }
    ]
  },
  {
    id: 'cleaning_protocols',
    category: 'hygiene',
    text: "Le plan de nettoyage et de désinfection (PND) est-il affiché et rigoureusement suivi ?",
    options: [
      { label: "Oui, suivi et tracé quotidiennement", value: "yes", isCompliant: true },
      { label: "Affiché mais le traçage est irrégulier", value: "partial", isCompliant: false, remediation: "Sensibilisez l'équipe à l'importance du traçage sanitaire." },
      { label: "Non affiché ou non suivi", value: "no", isCompliant: false, remediation: "Mise en place immédiate d'un PND conforme aux normes PMI." }
    ]
  },
  {
    id: 'staff_diplomas',
    category: 'staffing',
    text: "La structure dispose-t-elle de 40% de personnel 'diplômé qualifié' (CAP AEPE + 3 ans d'exp, Auxiliaire de Puériculture, EJE) ?",
    options: [
      { label: "Oui, conforme", value: "yes", isCompliant: true },
      { label: "En cours de recrutement/VAE", value: "in_progress", isCompliant: false, remediation: "Accompagnez vos salariés vers la VAE ou finalisez vos recrutements qualifiés." },
      { label: "Non conforme", value: "no", isCompliant: false, remediation: "Ajustement urgent de la composition de l'équipe requis." }
    ]
  }
]
