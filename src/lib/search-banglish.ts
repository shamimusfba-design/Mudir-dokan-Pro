/**
 * MudirDokan Pro — Banglish, Phonetic & Multi-Keyword Search Engine
 * Handles natural Bangla transliterations (e.g. "chal" -> চাল/Rice, "tel" -> তেল/Oil)
 * and multi-word token matching in any order (e.g. "fresh chal", "aci salt").
 */

export const BANGLISH_ALIASES: Record<string, string[]> = {
  // Rice / চাল
  chal: ['চাল', 'rice', 'miniket', 'nazirshail', 'chinigura', 'basmati', 'paijam', 'atash', 'chira', 'muri', 'পোলাও'],
  chaal: ['চাল', 'rice', 'miniket', 'nazirshail', 'chinigura', 'basmati'],
  chawl: ['চাল', 'rice'],
  cal: ['চাল', 'rice'],
  caal: ['চাল', 'rice'],
  saal: ['চাল', 'rice'],
  sal: ['চাল', 'rice'],
  chawal: ['চাল', 'rice'],
  chawol: ['চাল', 'rice'],
  chaul: ['চাল', 'rice'],
  bhat: ['ভাত', 'চাল', 'rice'],
  rice: ['চাল', 'rice'],

  // Dal / ডাল
  dal: ['ডাল', 'dal', 'masoor', 'mosur', 'moong', 'mung', 'chickpea', 'boot', 'motor', 'besan'],
  daal: ['ডাল', 'dal', 'masoor', 'moong'],
  dhal: ['ডাল', 'dal'],
  lentil: ['ডাল', 'lentil', 'masoor'],

  // Oil / তেল
  tel: ['তেল', 'oil', 'soybean', 'mustard', 'sorisha', 'sunflower', 'rice bran'],
  toil: ['তেল', 'oil'],
  tail: ['তেল', 'oil'],
  oil: ['তেল', 'oil'],
  sorisha: ['সরিষা', 'mustard'],
  shorisha: ['সরিষা', 'mustard'],
  mustard: ['সরিষা', 'mustard', 'তৈল'],
  soyabean: ['সয়াবিন', 'soybean'],
  soybean: ['সয়াবিন', 'soybean'],

  // Milk / দুধ
  dudh: ['দুধ', 'milk', 'dano', 'diploma', 'marks', 'fresh', 'nido', 'red cow', 'starship', 'uht'],
  dud: ['দুধ', 'milk'],
  doodh: ['দুধ', 'milk'],
  milk: ['দুধ', 'milk'],
  doi: ['দই', 'curd', 'yogurt'],
  doy: ['দই', 'curd'],
  curd: ['দই', 'curd'],
  ponir: ['পনির', 'paneer', 'cheese'],
  paneer: ['পনির', 'paneer'],
  makon: ['মাখন', 'butter'],
  butter: ['মাখন', 'butter'],
  ghee: ['ঘি', 'ghee'],
  ghi: ['ঘি', 'ghee'],

  // Sugar / চিনি
  chini: ['চিনি', 'sugar'],
  cheeni: ['চিনি', 'sugar'],
  sugar: ['চিনি', 'sugar'],
  gur: ['গুড়', 'jaggery'],
  goor: ['গুড়', 'jaggery'],

  // Salt / লবণ
  lobon: ['লবণ', 'salt', 'নুন'],
  nobon: ['লবণ', 'salt'],
  noon: ['লবণ', 'নুন', 'salt'],
  nun: ['লবণ', 'নুন', 'salt'],
  salt: ['লবণ', 'salt'],

  // Flour / আটা, ময়দা, সুজি
  atta: ['আটা', 'atta', 'flour'],
  aata: ['আটা', 'atta'],
  moyda: ['ময়দা', 'maida', 'flour'],
  maida: ['ময়দা', 'maida'],
  suji: ['সুজি', 'suji', 'semolina'],
  sooji: ['সুজি', 'suji'],
  besan: ['বেসন', 'besan'],

  // Tea & Coffee / চা ও কফি
  cha: ['চা', 'tea', 'ispahani', 'mirzapore', 'taaza', 'finlay', 'lipton'],
  tsa: ['চা', 'tea'],
  tea: ['চা', 'tea'],
  kofi: ['কফি', 'coffee', 'nescafe'],
  kophi: ['কফি', 'coffee'],
  coffee: ['কফি', 'coffee'],

  // Spices / মসলা
  mosla: ['মসলা', 'spice', 'spices', 'masala', 'radhuni'],
  moshla: ['মসলা', 'masala'],
  masala: ['মসলা', 'masala'],
  holud: ['হলুদ', 'turmeric'],
  holid: ['হলুদ', 'turmeric'],
  turmeric: ['হলুদ', 'turmeric'],
  morich: ['মরিচ', 'chili', 'chilli'],
  moris: ['মরিচ', 'chili'],
  chili: ['মরিচ', 'chili'],
  chilli: ['মরিচ', 'chili'],
  dhonia: ['ধনিয়া', 'ধনে', 'coriander'],
  dhone: ['ধনে', 'coriander'],
  coriander: ['ধনিয়া', 'coriander'],
  jira: ['জিরা', 'cumin'],
  jeera: ['জিরা', 'cumin'],
  cumin: ['জিরা', 'cumin'],
  elach: ['এলাচ', 'cardamom'],
  cardamom: ['এলাচ', 'cardamom'],
  daruchini: ['দারুচিনি', 'cinnamon'],
  cinnamon: ['দারুচিনি', 'cinnamon'],
  lobongo: ['লবঙ্গ', 'clove'],
  clove: ['লবঙ্গ', 'clove'],
  tejpata: ['তেজপাতা', 'bay leaf'],
  golmorich: ['গোলমরিচ', 'black pepper'],

  // Snacks & Biscuits / স্ন্যাক্স ও বিস্কুট
  biskut: ['বিস্কুট', 'biscuit', 'cookies', 'toast'],
  biscut: ['বিস্কুট', 'biscuit'],
  biscuit: ['বিস্কুট', 'biscuit'],
  toast: ['টোস্ট', 'toast'],
  cookies: ['কুকিজ', 'cookies'],
  chanachur: ['চানাচুর', 'chanachur', 'ruchi', 'bombay sweets'],
  chanasur: ['চানাচুর', 'chanachur'],
  chips: ['চিপস', 'chips', 'potato crackers', 'crackers', 'alooj'],
  cip: ['চিপস', 'chips'],
  muri: ['মুড়ি', 'muri', 'puffed rice'],
  chira: ['চিড়া', 'chira', 'flattened rice'],
  khoi: ['খই', 'puffed paddy'],
  noodles: ['নুডুলস', 'noodles', 'maggi', 'doodles', 'chopstick', 'pasta'],
  nuduls: ['নুডুলস', 'noodles'],
  pasta: ['পাস্তা', 'pasta', 'macaroni'],
  shemai: ['সেমাই', 'semai', 'vermicelli'],
  semai: ['সেমাই', 'semai'],

  // Soap & Personal Care / সাবান ও পার্সোনাল কেয়ার
  shaban: ['সাবান', 'soap', 'lux', 'lifebuoy', 'dove', 'dettol', 'savlon'],
  sabun: ['সাবান', 'soap'],
  soap: ['সাবান', 'soap'],
  shampoo: ['শ্যাম্পু', 'shampoo', 'sunsilk', 'clear', 'pantene', 'head & shoulders'],
  shampu: ['শ্যাম্পু', 'shampoo'],
  tel_chul: ['তেল', 'coconut oil', 'parachute', 'jui'],
  narikel_tel: ['নারকেল তেল', 'coconut oil', 'parachute', 'jui'],
  coconut_oil: ['নারকেল তেল', 'coconut oil'],
  paste: ['টুথপেস্ট', 'toothpaste', 'closeup', 'pepsodent', 'colgate'],
  pest: ['টুথপেস্ট', 'toothpaste'],
  brush: ['টুথব্রাশ', 'toothbrush'],
  tisshu: ['টিস্যু', 'tissue', 'bashundhara'],
  tissue: ['টিস্যু', 'tissue'],

  // Cleaning & Detergent
  detergent: ['ডিটারজেন্ট', 'detergent', 'wheel', 'surf excel', 'rin', 'tide', 'chaka'],
  sharf: ['সার্ফ', 'surf excel', 'detergent'],
  surf: ['সার্ফ', 'surf excel'],
  vim: ['ভিম', 'vim', 'dishwashing'],
  liquid: ['লিকুইড', 'liquid'],
  harpic: ['হারপিক', 'harpic', 'toilet cleaner'],
  savlon: ['স্যাভলন', 'savlon', 'antiseptic'],
  dettol: ['ডেটলে', 'dettol', 'antiseptic'],

  // Drinks & Water
  pani: ['পানি', 'water', 'kinley', 'mum', 'aquafina', 'fresh'],
  water: ['পানি', 'water'],
  juice: ['জুস', 'juice', 'pran', 'frutika'],
  dim: ['ডিম', 'egg', 'eggs'],
  egg: ['ডিম', 'egg', 'eggs'],
  anda: ['ডিম', 'egg'],
};

/**
 * Checks if a searchable text matches all tokens in the query with Banglish support.
 */
export function matchesBanglishQuery(searchCorpus: string, query: string): boolean {
  if (!query) return true;
  let cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return true;

  // Normalize spaced single letters like "c h a l" or "c  h  a  l" -> "chal"
  cleanQ = cleanQ.replace(/(\b[a-z]\s+)+[a-z]\b/g, (m) => m.replace(/\s+/g, ''));

  // Split query into individual words/tokens
  const tokens = cleanQ.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  // Each token must match somewhere in searchCorpus (either direct substring or via alias)
  for (const token of tokens) {
    let tokenMatched = false;

    // Direct match
    if (searchCorpus.includes(token)) {
      tokenMatched = true;
    } else {
      // Check aliases for this token
      const aliases = BANGLISH_ALIASES[token];
      if (aliases && aliases.length > 0) {
        for (const alias of aliases) {
          if (searchCorpus.includes(alias.toLowerCase())) {
            tokenMatched = true;
            break;
          }
        }
      }
    }

    if (!tokenMatched) {
      return false; // Token didn't match anything
    }
  }

  return true;
}
