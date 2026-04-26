import { Refrigerator } from "lucide-react";

export const unitTypes = {
  // Tablets / Capsules
  pack: {
    label: "Tablet / Capsule (Strip Based)",
    fields: {
      total_pack: "Number of Packs",
      pack_strip: "Strips Per Pack",
      strip_tablet: "Tablets Per Strip",
    },
  },
  strip: {
    label: "Tablet / Capsule (Loose Strips)",
    fields: {
      total_pack: "Number of Strips",
      strip_tablet: "Tablets Per Strip",
    },
  },
  bottle: {
    label: "Tablet / Capsule (Bottle Based) Full Pack",
    fields: {
      total_pack: "Number of Bottles",
      pack_strip: "Tablets Per Bottle",
    },
  },
  loose: {
    label: "Strip or Bottle based (Loose Tablets)",
    fields: {
      total_pack: "Number of Tablets",
    },
  },

  // Liquids
  liquid: {
    label: "Liquid (Syrup / Drops)",
    fields: {
      total_pack: "Number of Bottles",
    },
  },

  // Injections
  injection: {
    label: "Injection / IV (Box Based)",
    fields: {
      total_pack: "Number of Boxes",
      pack_strip: "Injections Per Box",
    },
  },
  injections: {
    label: "Injection / IV (Unit Based)",
    fields: {
      total_pack: "Number of Units",
    },
  },

  // Topicals
  tube: {
    label: "Cream / Ointment / Gel",
    fields: {
      total_pack: "Number of Tubes or Containers",
    },
  },

  unitbased: {
    label: "Units (Box Based)",
    fields: {
      total_pack: "Number of Boxes",
      pack_strip: "Units Per Box",
    },
  },
   refrigerator: {
    label: "Refrigerated Based unit",
    fields: {
       total_pack: "Number of Units",
    
    },
  },
  medicalitems: {
    label: "Medical Items",
    fields: {
      total_pack: "Number of Units",
    },
  },
  respiratoryTherapeuticDevices: {
    label: "Respiratory Therapeutic Devices",
    fields: {
      total_pack: "Number of Units",
    },
  },
};
