const fs = require('fs');

const replaceInFile = (file, replacements) => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.search, r.replace);
  });
  fs.writeFileSync(file, content);
}

replaceInFile('src/components/LiveMatchPanel.tsx', [
  { search: "import React, { useState, useEffect } from 'react';", replace: "import { useState, useEffect } from 'react';" },
  { search: "import { supabase } from '../lib/supabase';\n", replace: "" }
]);

replaceInFile('src/components/Onboarding.tsx', [
  { search: "import React, { useState } from 'react';", replace: "import { useState } from 'react';" }
]);

replaceInFile('src/pages/PublicBlog.tsx', [
  { search: "import React, { useState, useEffect } from 'react';", replace: "import { useState, useEffect } from 'react';" }
]);

replaceInFile('src/pages/PublicDashboard.tsx', [
  { search: "import React from 'react';", replace: "" },
  { search: "import { Trophy, Users, Calendar, Activity, Star } from 'lucide-react';", replace: "import { Trophy, Activity, Star } from 'lucide-react';" }
]);

replaceInFile('src/pages/PublicRegistration.tsx', [
  { search: "import { Upload, CheckCircle, Users } from 'lucide-react';", replace: "import { Upload, CheckCircle } from 'lucide-react';" }
]);

replaceInFile('src/pages/PublicRules.tsx', [
  { search: "import React from 'react';", replace: "" }
]);

console.log('Fixed imports');
