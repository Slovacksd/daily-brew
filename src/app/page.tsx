"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Language = 'en' | 'es' | 'ja' | 'zh' | 'hi';

type MenuItem = 
{
  name: string;
  price: string;
  description: string;
  image?: string;

};


type MenuSection = 'Coffee' | 'Pastries';


type MenuDetailItem = 
{
  name: string;
  price: string;
  description: string;
  rusticDescription: string;
  image: string;
  section: MenuSection;

};


type RandomLocation = 
{
  label: string;
  latitude: number;
  longitude: number;

};


export default function Home() 
{
  const [isDark, setIsDark] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const [activePage, setActivePage] = useState<string>("Menu");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [storeCart, setStoreCart] = useState<Record<string, { name: string; price: string; quantity: number }>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState(
  {
    fullName: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    billingZip: ""
  
  });


  const [language, setLanguage] = useState<Language>('en');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  const [isLangMenuPinned, setIsLangMenuPinned] = useState(false);
  const [coffeeImage, setCoffeeImage] = useState<string | null>(null);
  const [coffeeImageLoading, setCoffeeImageLoading] = useState(false);
  
  const [reservationForm, setReservationForm] = useState({ email: "", comments: "" });
  const [reservationStatus, setReservationStatus] = useState<'idle' | 'success'>('idle');
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  
  const [selectedWord, setSelectedWord] = useState("");
  const [wordsearchFeedback, setWordsearchFeedback] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuDetailItem | null>(null);
  
  const [isQuantityPromptOpen, setIsQuantityPromptOpen] = useState(false);
  const [quantityInput, setQuantityInput] = useState("1");
  const [quantityFeedback, setQuantityFeedback] = useState<string | null>(null);
  
  const [randomLocation, setRandomLocation] = useState<RandomLocation | null>(null);
  const [randomLocationLoading, setRandomLocationLoading] = useState(false);
  const [randomLocationError, setRandomLocationError] = useState<string | null>(null);
  
  const wordsearchGrid = 
  [
    ['C', 'O', 'F', 'F', 'E', 'E', 'B', 'R', 'E', 'W'],
    ['A', 'R', 'O', 'M', 'A', 'S', 'P', 'C', 'A', 'T'],
    ['F', 'E', 'S', 'T', 'H', 'O', 'U', 'R', 'S', 'E'],
    ['E', 'A', 'B', 'A', 'R', 'I', 'S', 'T', 'A', 'A'],
    ['L', 'A', 'T', 'T', 'E', 'M', 'I', 'L', 'K', 'M'],
    ['C', 'U', 'P', 'R', 'I', 'T', 'Z', 'D', 'A', 'R'],
    ['S', 'T', 'E', 'A', 'M', 'E', 'D', 'C', 'U', 'K'],
    ['E', 'S', 'P', 'R', 'E', 'S', 'S', 'O', 'T', 'S']
  ];

  const wordsearchWords = ['COFFEE', 'BREW', 'AROMA', 'HOURS', 'BARISTA', 'LATTE', 'CUP', 'STEAMED', 'ESPRESSO'];

  const openMenuDetail = (item: MenuDetailItem) =>
  {
    setSelectedMenuItem(item);
  
  };


  const closeMenuDetail = () =>
  {
    setSelectedMenuItem(null);
  
  };


  const openLanguageMenu = () =>
  {
    if (langMenuCloseTimerRef.current !== null)
    {
      window.clearTimeout(langMenuCloseTimerRef.current);
      langMenuCloseTimerRef.current = null;
    
    }
    setIsLangMenuOpen(true);
  
  };

  const scheduleCloseLanguageMenu = () =>
  {
    
    if (isLangMenuPinned)
    {
      return;
    
    }


    if (langMenuCloseTimerRef.current !== null)
    {
      window.clearTimeout(langMenuCloseTimerRef.current);
    
    }


    langMenuCloseTimerRef.current = window.setTimeout(() =>
    {
      setIsLangMenuOpen(false);
      langMenuCloseTimerRef.current = null;
    
    }, 180);
  
  };

  // random coords token moved to a server-side environment variable and proxy.
  // Client will call the local `/api/random-location` route so the token is not exposed.

  const extractCoordinateValue = (candidate: unknown, keys: string[]) =>
  {
    if (!candidate || typeof candidate !== 'object')
    {
      return undefined;
    }

    const record = candidate as Record<string, unknown>;
    for (const key of keys)
    {
      const value = record[key];


      if (typeof value === 'number' && Number.isFinite(value))
      {
        return value;
      }


      if (typeof value === 'string' && value.trim())
      {
        const parsed = Number(value);
        
        if (Number.isFinite(parsed))
        {
          return parsed;
        
        }
      
      }
    
    }
    return undefined;
  
  };


  const extractRandomLocation = (payload: unknown): RandomLocation | null =>
  {
    const candidates = Array.isArray(payload)
      ? payload : (payload && typeof payload === 'object')
        ? [payload as Record<string, unknown>, 
          (payload as Record<string, unknown>).data, (payload as Record<string, unknown>).results] : [];

    const flattened = candidates.flatMap((candidate) => 
      Array.isArray(candidate) ? candidate : [candidate]).filter(Boolean) as Record<string, unknown>[];

    const parseCoordinatesArray = (arr: unknown): { lat?: number; lon?: number } => 
    {
      if (!Array.isArray(arr) || arr.length < 2) return {};
      
      const a = Number(arr[0]);
      const b = Number(arr[1]);
      
      if (!Number.isFinite(a) || !Number.isFinite(b)) return {};
      
      const isALat = a >= -90 && a <= 90;
      const isBLon = b >= -180 && b <= 180;
      
      if (isALat && isBLon) return { lat: a, lon: b };
      
      const isBLat = b >= -90 && b <= 90;
      const isALon = a >= -180 && a <= 180;
      
      if (isBLat && isALon) return { lat: b, lon: a };
      return {};
    
    };


    for (const item of flattened)
    {
      let latitude = extractCoordinateValue(item, ['latitude', 'lat']);
      let longitude = extractCoordinateValue(item, ['longitude', 'lng', 'lon']);

      if ((latitude === undefined || longitude === undefined) && item && typeof item === 'object')
      {
        const rec = item as Record<string, unknown>;
        const coordsCandidate = rec.coordinates ?? (rec.geometry && (rec.geometry as Record<string, unknown>).coordinates);
        
        if (coordsCandidate)
        {
          const parsed = parseCoordinatesArray(coordsCandidate);
          
          if (parsed.lat !== undefined && parsed.lon !== undefined)
          {
            latitude = parsed.lat;
            longitude = parsed.lon;
          }
        
        }
      
      }

      
      if (latitude === undefined || longitude === undefined)
      {
        continue;
      
      }

      const labelParts = [item.city, item.state, item.country].filter((part) => 
                          typeof part === 'string' && part.trim()) as string[];
      
      const label = labelParts.join(', ') || 'Random U.S. location';

      return {
        label,
        latitude,
        longitude
      };
    
    }

    return null;
  
  };

  const loadRandomLocation = async () => 
  {
    setRandomLocationLoading(true);
    setRandomLocationError(null);

    try 
    {
      const response = await fetch('/api/random-location');
      
      if (!response.ok) 
      {
        const text = await response.text().catch(() => '');
        throw new Error(`Location proxy failed: ${response.status} ${text}`);
      
      }
      const payload = await response.json().catch(() => null);

      if (payload && typeof payload === 'object' && typeof (payload as any).latitude === 'number' && 
                                                      typeof (payload as any).longitude === 'number') 
      {
        setRandomLocation(
        {
          label: (payload as any).label || 'Random U.S. location',
          latitude: Number((payload as any).latitude),
          longitude: Number((payload as any).longitude)
        
        });
      
      } else 
      {
        // Fallback: try the more flexible parser used earlier
        const location = extractRandomLocation(payload);
        
        if (!location) throw new Error('Proxy returned no usable coordinates.');
        
        setRandomLocation(location);
      
      }
    
    } catch (error) 
    {
      setRandomLocationError(error instanceof Error ? error.message : 'Unable to load random location.');
    
    } finally 
    {
      setRandomLocationLoading(false);
    }
  
  };

  const toggleLanguageMenu = () =>
  {
    setIsLangMenuPinned(prevPinned =>
    {
      const nextPinned = !prevPinned;
      setIsLangMenuOpen(nextPinned);

      if (!nextPinned && langMenuCloseTimerRef.current !== null)
      {
        window.clearTimeout(langMenuCloseTimerRef.current);
        langMenuCloseTimerRef.current = null;
      }

      return nextPinned;
    
    });
  
  };

  // Wordsearch handlers
  const handleWordsearchSelection = () =>
  {
    const selectedText = window.getSelection()?.toString().toUpperCase().replace(/\s/g, '') || '';
    
    if (selectedText.length > 0)
    {
      setSelectedWord(selectedText);
    
    }
  
  };

  // Wordsearch submit handler
  const handleWordsearchSubmit = (event: React.SubmitEvent<HTMLFormElement>) =>
  {
    event.preventDefault();

    // Process the selected word and check against the word list
    const candidate = selectedWord.trim().toUpperCase().replace(/\s/g, '');
    
    if (!candidate)
    {
      return;
    }

    try
    {
      // Use a regex to allow for flexible matching (e.g., ignoring extra spaces or minor typos)
      const regex = new RegExp(candidate, 'i');
      const matchedWord = wordsearchWords.find(word => regex.test(word));

      if (matchedWord)
      {
        // Add the matched word to the set of found words
        setFoundWords(prev => new Set(prev).add(matchedWord));
        setWordsearchFeedback('Success');
      
      } else
      {
        setWordsearchFeedback('Try again');
      }
    
    } catch
    {
      setWordsearchFeedback('Try again');
    }
  
  };

  
  const navRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const langMenuCloseTimerRef = useRef<number | null>(null);
  
  
  const translations: Record<string, any> = 
  {
    en: 
    {
      siteName: "The Daily Brew",
      tagline: "A cozy corner for great coffee",
      welcome: "Welcome to your neighborhood coffee shop",
      searchPlaceholder: "Search menu (supports regex: e.g., 'Coffee|Muffin', '^C.*o$')...",
      clear: "Clear",
      invalidRegex: "Invalid regex pattern. Please check your syntax.",
      noResults: "No results found.",
      backToMenu: "Back to Menu",
      navItems: { Home: "Home", Products: "Products", Contact: "Contact" },
      subNav: 
      {
        "About Us": "About Us",
        "Our Story": "Our Story",
        Team: "Team",
        Coffee: "Coffee",
        Pastries: "Pastries",
        Merchandise: "Merchandise",
        Location: "Location",
        Hours: "Hours",
        Reservations: "Reservations"
      
      },
      
      pageContent: 
      {
        "About Us": 
        {
          title: "About The Daily Brew",
          content:
            "Starting in 1998, Alice and Bob have led a life of purpose, integrity, and an eye for the weight of a coffee bean. " +
            "This hardworking hippy powercouple built The Daily Brew from hearty origins, with a dream shaped by long mornings, earthy roads, " + 
            "and the grassroots people of the earth who deserved a warmer, gentler place to gather. " +
            "They opened this rustic coffeeshop to honor honest labor, patient roasting, and the kind of hospitality that makes every visitor feel like they belong. " +
            "Over the years, their little corner became a meeting place for neighbors, wanderers, dreamers, and everyday folks who simply wanted a fine roast, a quiet seat, " + 
            "and a small reminder that good coffee can be shared with everyone."
        
        },
        
        "Our Story": 
        { 
          title: "Our Story", content: "Started as a small corner shop, we've grown into a neighborhood gathering place serving thoughtful coffee and baked goods." 
        },
        
        Team: 
        { 
          title: "Meet Our Team", content: "Our baristas and bakers bring care and craft to every cup and pastry." 
        },
        
        Coffee: 
        { 
          title: "Our Coffee Selection", content: "Single-origin beans and seasonal blends, brewed with attention." 
        },
        
        Pastries: 
        { 
          title: "Freshly Baked Pastries", content: "Handmade pastries baked daily using traditional techniques." 
        },
        
        Merchandise: 
        { 
          title: "Take Home the Brew", content: "Whole bean, merch, and brewing gear available in-store." 
        },
        
        Location: 
        { 
          title: "Visit Us", content: "Find us at 123 Coffee Lane — cozy seating and friendly service." 
        },
        
        Hours: 
        { 
          title: "Hours of Operation", content: "Mon-Fri 7am - 7pm; Sat-Sun 8am - 8pm" 
        },
        
        Reservations: 
        { 
          title: "Book Your Visit", content: "Contact us to reserve a table or book an event." 
        }
      
      },
      
      drinks: 
      {
        title: "Handcrafted Brews",
        items: 
        {
          Espresso: 
          { 
            name: "Espresso", description: "Rich, concentrated coffee." 
          },
          
          Cappuccino: 
          { 
            name: "Cappuccino", description: "Espresso with steamed milk and foam." 
          },
          
          Latte: 
          { 
            name: "Latte", description: "Smooth espresso with steamed milk." 
          },
          
          Americano: 
          { 
            name: "Americano", description: "Espresso diluted with hot water." 
          }
        
        }
      
      },
      
      pastries: 
      {
        title: "Baked Goods & Comfort",
        items: 
        {
          Croissant: 
          { 
            name: "Golden Morning Croissant", description: "Buttery, flaky croissant." 
          },
          
          "Blueberry Muffin": 
          { 
            name: "Farmhouse Blueberry Muffin", description: "Thick muffin with orchard blueberries." 
          },
          
          "Almond Biscotti": 
          { 
            name: "Rustic Almond Biscotti", description: "Twice-baked crunchy biscotti." 
          },
          
          "Chocolate Chip Cookie": 
          { 
            name: "Cabin-Style Chocolate Chunk Cookie", description: "Chunky, chewy cookie with dark chocolate." 
          }
        
        }
      
      },
      footer: 
      { 
        address: "123 Coffee Lane", phone: "(555) 123-4567", hours: "Open Daily 7am - 7pm" 
      }
    
    },
    es: 
    {
      siteName: "El Café Diario",
      tagline: "Un rincón acogedor para un gran café",
      welcome: "¡Bienvenido a tu cafetería de barrio!",
      
      searchPlaceholder: "Buscar menú (ej.: 'Café|Muffin', '^C.*o$')...",
      clear: "Borrar",
      invalidRegex: "Patrón regex inválido. Por favor verifica la sintaxis.",
      
      noResults: "No se encontraron resultados.",
      backToMenu: "Volver al Menú",
      
      navItems: 
      { 
        Home: "Inicio", Products: "Productos", Contact: "Contacto" 
      },
      
      subNav: 
      { 
        "About Us": "Sobre Nosotros", 
        "Our Story": "Nuestra Historia", 
        Team: "Equipo", 
        Coffee: "Café", 
        Pastries: "Pasteles", 
        Merchandise: "Merchandise", 
        Location: "Ubicación", 
        Hours: "Horario", 
        Reservations: "Reservaciones" 
      },

      pageContent: 
      {
        "About Us": 
        { 
          title: "Sobre El Café Diario", content: "Fundado por amantes del café, centrados en calidad y comunidad." 
        },
        
        "Our Story": 
        { 
          title: "Nuestro Viaje", content: "Comenzamos como una pequeña tienda de esquina y crecimos con la comunidad." 
        },

        Team: 
        { 
          title: "Conoce a Nuestro Equipo", content: "Baristas y panaderos que ponen cariño en cada producto." 
        },

        Coffee: 
        { 
          title: "Nuestra Selección de Café", content: "Granos de origen único y mezclas de temporada." 
        },

        Pastries: 
        { 
          title: "Pasteles Recién Horneados", content: "Productos horneados a mano diariamente." 
        },

        Merchandise: 
        { 
          title: "Lleva el Café a Casa", content: "Granos, merch y equipo disponible en tienda." 
        },

        Location: 
        { 
          title: "Visítanos", content: "Estamos en 123 Coffee Lane — asientos acogedores y buen servicio." 
        },

        Hours: 
        { 
          title: "Horario", content: "Lun-Vie 7:00 - 19:00; Sáb-Dom 8:00 - 20:00" 
        },

        Reservations: 
        { 
          title: "Reserva tu Visita", content: "Contáctanos para reservar mesa o eventos." 
        }
      
      },
      
      drinks: 
      { 
        title: "Bebidas", 
        items: 
        { 
          Espresso: 
          { 
            name: "Espresso", description: "Café concentrado y rico." 
          }, 
            Cappuccino: 
            { 
              name: "Cappuccino", description: "Espresso con leche vaporizada y espuma." 
            }, 
            Latte: 
            { 
              name: "Latte", description: "Espresso con leche suave." 
            }, 
            Americano: 
            { name: "Americano", description: "Espresso alargado con agua caliente." 

            } 
          } 
        },
      
      pastries: 
      { 
        title: "Productos Caseros", 
        items: 
        { 
          Croissant: 
          { 
            name: "Croissant de la Mañana", 
            description: "Croissant mantecoso y hojaldrado." 
          }, 
          "Blueberry Muffin": 
          { 
            name: "Muffin de Arándanos", 
            description: "Muffin jugoso con arándanos." 
          }, "Almond Biscotti": 
          { 
            name: "Biscotti de Almendra", 
            description: "Biscotti crujiente horneado dos veces." 
          }, 
          "Chocolate Chip Cookie": 
          { 
            name: "Galleta de Chocolate", 
            description: "Galleta con trozos de chocolate." 
          } 
        
        } 
      
      },
      
      footer: 
      { 
        address: "123 Coffee Lane", phone: "(555) 123-4567", hours: "Abierto Diario 7am - 7pm" 
      }
    
    },
    
    ja: 
    {
      siteName: "デイリーブリュー",
      tagline: "素敵なコーヒーのための居心地の良い場所",
      welcome: "地域のコーヒーショップへようこそ",
      
      searchPlaceholder: "メニューを検索（例：'Coffee|Muffin', '^C.*o$'）...",
      clear: "クリア",
      invalidRegex: "無効な正規表現です。構文を確認してください。",
      
      noResults: "結果が見つかりませんでした。",
      backToMenu: "メニューに戻る",
      
      navItems: 
      { 
        Home: "ホーム", Products: "商品", Contact: "お問い合わせ" 
      },

      subNav: 
      { "About Us": "私たちについて", 
        "Our Story": "私たちの物語", 
        Team: "チーム", 
        Coffee: "コーヒー", 
        Pastries: "ペストリー", 
        Merchandise: "お会計", 
        Location: "場所", 
        Hours: "営業時間", 
        Reservations: "予約" 
      },

      pageContent: 
      {
        "About Us": 
        { 
          title: "デイリーブリューについて", content: "職人技のコーヒーと焼きたてのペストリーを提供する地域のカフェです。" 
        },

        "Our Story": 
        { 
          title: "私たちの旅", content: "小さな角の店から、コミュニティに愛される場所へと成長しました。" 
        },
        
        Team: 
        { 
          title: "チーム紹介", content: "バリスタとベイカーが心を込めて働いています。" 
        },
        
        Coffee: 
        { 
          title: "コーヒーのセレクション", content: "シングルオリジンと季節のブレンドを提供します。" 
        },
        
        Pastries: 
        { 
          title: "焼きたてのペイストリー", content: "毎日手作りで焼き上げます。" 
        },
        
        Merchandise: 
        { 
          title: "お持ち帰り", content: "豆やグッズ、器具を販売しています。" 
        },
        
        Location: 
        { 
          title: "アクセス", content: "123 Coffee Lane にあります。" 
        },
        
        Hours: 
        { 
          title: "営業時間", content: "月〜金 7:00 - 19:00、土日 8:00 - 20:00" 
        },

        Reservations: 
        { 
          title: "予約", content: "テーブルやイベントの予約はこちらから。" 
        }
      
      },
      
      drinks: 
      { 
        title: "ドリンク", 
        items: 
        { 
          Espresso: 
          { name: "エスプレッソ", 
            description: "濃厚で力強い一杯。" 
          }, 
          Cappuccino: 
          { 
            name: "カプチーノ", 
            description: "エスプレッソとスチームミルクの調和。" 
          }, 
          Latte: 
          { 
            name: "ラテ", 
            description: "滑らかなエスプレッソとミルク。" 
          }, 
          Americano: 
          { 
            name: "アメリカーノ", 
            description: "お湯で割ったエスプレッソ。" 
          } 
        } 
      },

      pastries: 
      { 
        title: "ペイストリー", 
        items: 
        { 
          Croissant: 
          { 
            name: "ゴールデン・モーニング・クロワッサン", 
            description: "バターたっぷりのサクサク生地。" 
          }, 
          "Blueberry Muffin": 
          { 
            name: "ファームハウス・ブルーベリーマフィン", 
            description: "たっぷりのブルーベリー入り。" 
          }, 
          "Almond Biscotti": 
          { 
            name: "アーモンド・ビスコッティ", 
            description: "二度焼きでカリッとした食感。" 
          }, 
          "Chocolate Chip Cookie": 
          { 
            name: "チョコレート・チャンク・クッキー", 
            description: "チョコたっぷりの贅沢クッキー。" 
          } 
        
        } 
      
      },

      footer: 
      { 
        address: "123 Coffee Lane", phone: "(555) 123-4567", hours: "毎日 7:00 - 19:00" 
      }
    
    },

    hi: 
    {
      siteName: "द डेली ब्रू",
      tagline: "बेहतरीन कॉफी के लिए एक आरामदायक कोना",
      welcome: "आपके पड़ोस की कॉफी शॉप में स्वागत है",
      
      searchPlaceholder: "मेनू खोजें (उदा.: 'Coffee|Muffin', '^C.*o$')...",
      clear: "साफ़ करें",
      invalidRegex: "अमान्य regex पैटर्न। कृपया वाक्य-विन्यास जाँचें।",
      
      noResults: "कोई परिणाम नहीं मिला।",
      backToMenu: "मेनू पर वापस जाएं",
      
      navItems: 
      { 
        Home: "होम", 
        Products: "उत्पाद", 
        Contact: "संपर्क" 
      },
      
      subNav: 
      { 
        "About Us": "हमारे बारे में", 
        "Our Story": "हमारी कहानी", 
        Team: "टीम", 
        Coffee: "कॉफ़ी", 
        Pastries: "पेस्ट्री", 
        Merchandise: "मर्चेंडाइज़", 
        Location: "स्थान", 
        Hours: "घंटे", 
        Reservations: "आरक्षण" 
      },

      pageContent: 
      {
        "About Us": 
        { 
          title: "द डेली ब्रू के बारे में", 
          content: "कॉफीप्रेमियों द्वारा स्थापित, हम गुणवत्ता और समुदाय पर ध्यान देते हैं।" 
        },
        
        "Our Story": 
        { 
          title: "हमारी कहानी", 
          content: "एक छोटे कॉर्नर शॉप से शुरू होकर, हम एक प्रिय पड़ोसी स्थल बन गए।" 
        },

        Team: 
        { 
          title: "हमारी टीम", content: "हमारे बारिस्टा और बेकर्स हर उत्पाद में मेहनत डालते हैं।" 
        },
        
        Coffee: 
        { 
          title: "हमारी कॉफी", content: "सिंगल-ऑरिजिन और मौसमी ब्लेंड उपलब्ध।" 
        },
        
        Pastries: 
        { 
          title: "ताजा पेस्ट्री", content: "हर दिन हाथ से बने पेस्ट्री।" 
        },
        
        Merchandise: 
        { 
          title: "लाएँ घर", content: "बीन्स, मर्च और ब्रूइंग गियर उपलब्ध।" 
        },
        
        Location: 
        { 
          title: "हमसे मिलें", content: "123 Coffee Lane पर पाएं — आरामदायक बैठने और मैत्रीपूर्ण सेवा।" 
        },
        
        Hours: 
        { 
          title: "समय", content: "सोम-शुक्र 7am - 7pm; शनि-रवि 8am - 8pm" 
        },
        
        Reservations: 
        { 
          title: "आरक्षण", content: "मेज़ या इवेंट बुक करने के लिए संपर्क करें।" 
        }
      
      },
      drinks:
      { 
        title: "ड्रिंक्स", 
        items: 
        { 
          Espresso: 
          { 
            name: "एस्प्रेसो", 
            description: "गाढ़ी, संकेंद्रित कॉफी।" 
          }, 
          Cappuccino: 
          { 
            name: "कैप्पुचीनो", 
            description: "एस्प्रेसो और वाष्पित दूध का मेल।" 
          }, 
          Latte: 
          { 
            name: "लट्टे", 
            description: "मुलायम दूध के साथ एस्प्रेसो।" 
          }, 
          Americano: 
          { 
            name: "अमेरिकानो", 
            description: "हॉट वॉटर के साथ एस्प्रेसो।" 
          } 
        
        } 
      
      },
      
      pastries: 
      { 
        title: "पेस्ट्री", 
        items: 
        { 
          Croissant: 
          { 
            name: "गोल्डन मॉर्निंग क्रोइसेंट", 
            description: "मक्खनयुक्त, परतदार क्रोइसेंट।" 
          }, 
          
          "Blueberry Muffin": 
          { 
            name: "फार्महाउस ब्लूबेरी मफिन", 
            description: "जूसदार ब्लूबेरी से भरा मफिन।" 
          }, 
          
          "Almond Biscotti": 
          { 
            name: "रस्टिक बादाम बिस्कोटी", 
            description: "दो बार बेक किया गया, कुरकुरा।" 
          }, 
          
          "Chocolate Chip Cookie": 
          { 
            name: "चॉकलेट चंक कुकी", 
            description: "चॉकलेट से भरी गहरी कुकी।" 
          } 
        } 
      },
      
      footer: 
      { 
        address: "123 Coffee Lane", 
        phone: "(555) 123-4567", 
        hours: "हर दिन 7am - 7pm" 
      }
    },

    zh: 
    {
      siteName: "每日匠心咖啡",
      tagline: "温馨角落，匠心咖啡",
      welcome: "欢迎光临您社区的咖啡馆",
      
      searchPlaceholder: "搜索菜单（示例：'Coffee|Muffin', '^C.*o$'）...",
      clear: "清除",
      invalidRegex: "无效的正则表达式。",
      
      noResults: "未找到结果。",
      backToMenu: "返回菜单",
      
      navItems: 
      { 
        Home: "首页", 
        Products: "商品", 
        Contact: "联系我们" 
      },
      
      subNav: 
      { 
        "About Us": "关于我们", 
        "Our Story": "我们的故事", 
        Team: "团队", 
        Coffee: "咖啡", 
        Pastries: "点心", 
        Merchandise: "商品", 
        Location: "位置", 
        Hours: "营业时间", 
        Reservations: "预订" 
      },

      pageContent: 
      {
        "About Us": 
        { 
          title: "关于每日匠心咖啡", 
          content: "一家关注品质、社区与手艺的咖啡馆。" 
        },

        "Our Story": 
        { 
          title: "我们的故事", 
          content: "从小店起步，逐步成长为邻里的聚会场所。" 
        },

        Team: 
        { 
          title: "认识我们的团队", 
          content: "我们的咖啡师和面包师以匠心制作每一份产品。" 
        },

        Coffee: 
        { 
          title: "我们的咖啡", content: "单一产地豆与季节性拼配，精心烘焙。" 
        },
        
        Pastries: 
        { 
          title: "现烤点心", content: "每日手工烘焙的新鲜点心。" 
        },
        
        Merchandise: 
        { 
          title: "带走我们的风味", content: "店内有整包咖啡豆、周边与冲泡器具。" 
        },
        
        Location: 
        { 
          title: "来访我们", content: "地址：123 Coffee Lane — 舒适座位，友好服务。" 
        },
        
        Hours: 
        { 
          title: "营业时间", content: "周一至周五 7:00 - 19:00；周末 8:00 - 20:00" 
        },
        
        Reservations: 
        { 
          title: "预订访问", content: "联系我们以预订座位或活动。" 
        }
      
      },
      
      drinks: 
      { 
        title: "手工咖啡", 
        items: 
        { 
          Espresso: 
          { 
            name: "浓缩咖啡", description: "浓郁、富有层次的浓缩咖啡。" 
          }, 
          
          Cappuccino: 
          { 
            name: "卡布奇诺", 
            description: "浓缩咖啡与蒸奶和奶泡的平衡。" 
          }, 
          
          Latte: 
          { 
            name: "拿铁", 
            description: "顺滑的浓缩咖啡加奶。" 
          }, 
          
          Americano: 
          { 
            name: "美式咖啡", 
            description: "用热水稀释的浓缩咖啡。" 
            
          } 
          
        } 
        
      },
      
      pastries: 
      { 
        title: "现烤点心", 
        items: 
        { 
          Croissant: 
          { 
            name: "金黄早晨牛角包", 
            description: "黄油香脆的多层牛角包。" 
          }, 
          
          "Blueberry Muffin": 
          { 
            name: "农场风味蓝莓玛芬", 
            description: "饱满蓝莓的多汁玛芬。" 
          }, 
          
          "Almond Biscotti": 
          { 
            name: "田园杏仁饼干", 
            description: "二次烘焙，口感酥脆。" 
          }, 
          
          "Chocolate Chip Cookie": 
          { 
            name: "厚实巧克力曲奇", 
            description: "满载巧克力碎的柔软曲奇。" 
          } 
        
        } 
      
      },
      
      footer: 
      { 
        address: "123 Coffee Lane", 
        phone: "(555) 123-4567", 
        hours: "每日 7am - 7pm" 
      }
    
    }
  
  };
  

  function getLocalized<T>(obj: Record<string, T>, lang: Language): T
  {
    // fallback to English when a key is missing for the requested language
    return ((obj as any)[lang] as T) ?? (obj as any)['en'] as T;
  
  }

  const cycleLanguage = () => 
  {
    const order: Language[] = ['en', 'es', 'ja', 'zh', 'hi'];
    setLanguage(prev =>
    {
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    
    });
  
  };


  const t = getLocalized(translations, language);
  const paymentCopy = getLocalized({
    en: 
    {

      title: "Checkout",
      description: "Enter your payment details to complete your order.",
      
      fullName: "Full name",
      email: "Email",
      
      cardNumber: "Card number",
      expiry: "Expiry (MM/YY)",
      
      cvv: "CVV",
      billingZip: "Billing ZIP",
      
      submit: "Process Payment",
      processing: "Processing...",
      
      success: "Payment complete",
      error: "Please provide valid payment details before submitting."
    
    },
    
    
    
    es: 
    {
      title: "Pago de Mercancía",
      description: "Ingresa tus datos de pago para completar tu pedido de mercancía.",
      
      fullName: "Nombre completo",
      email: "Correo electrónico",
      
      cardNumber: "Número de tarjeta",
      expiry: "Vencimiento (MM/AA)",
      
      cvv: "CVV",
      billingZip: "Código postal",
      
      submit: "Procesar Pago",
      processing: "Procesando...",
      
      success: "Pago completo",
      error: "Proporciona datos de pago válidos antes de enviar."
    
    },
    
    
    ja: 
    {
      title: "グッズ決済",
      description: "グッズ注文を完了するために決済情報を入力してください。",
      
      fullName: "氏名",
      email: "メールアドレス",
      
      cardNumber: "カード番号",
      expiry: "有効期限 (MM/YY)",
      
      cvv: "CVV",
      billingZip: "請求先郵便番号",
      
      submit: "支払いを処理",
      processing: "処理中...",
      
      success: "お支払い完了",
      error: "送信前に有効な決済情報を入力してください。"
    
    }
  
  }, language);


  const coffeeMenuCopy = getLocalized(
  {
    en: 
    {
      menuTitle: "Coffee Menu",
      pastryMenuTitle: "Pastry Menu",
      addToBasket: "Add to basket",
      
      basketTitle: "Store Basket",
      clearBasket: "Clear Basket",
      cartLabel: "Cart",
      
      goToCoffee: "Go to Coffee",
      goToCheckout: "Go to Checkout",
      checkoutConfirm: "Are you sure? You have {num_items} items in your cart."
    
    },


    es: 
    {
      menuTitle: "Menú de Café",
      pastryMenuTitle: "Menú de Pasteles",
      addToBasket: "Agregar a la cesta",
      
      basketTitle: "Cesta de la Tienda",
      clearBasket: "Vaciar Cesta",
      cartLabel: "Carrito",
      
      goToCoffee: "Ir a Café",
      goToCheckout: "Ir a Pago",
      checkoutConfirm: "¿Estás seguro? Tienes {num_items} en tu carrito."
    
    },
    
    
    ja: 
    {
      menuTitle: "コーヒーメニュー",
      pastryMenuTitle: "ペストリーメニュー",
      addToBasket: "バスケットに追加",
      basketTitle: "ストアバスケット",
      clearBasket: "バスケットを空にする",
      cartLabel: "カート",
      goToCoffee: "コーヒーへ",
      goToCheckout: "お会計へ",
      checkoutConfirm: "よろしいですか？カートに{num_items}入っています。"
    
    }
  
  }, language);


  const resolveActivePageKey = () =>
  {
    const match = Object.entries(t.subNav).find(([, localized]) => localized === activePage);
    return (match?.[0] ?? activePage) as keyof typeof t.pageContent;
  
  
  };



  const activePageKey = resolveActivePageKey();
  const isMerchandiseSection = activePageKey === "Merchandise";
  
  const isCoffeeSection = activePageKey === "Coffee";
  const isPastriesSection = activePageKey === "Pastries";
  
  const cartItems = Object.values(storeCart);
  const cartCount = Object.values(storeCart).reduce((sum, item) => sum + item.quantity, 0);

  const onPaymentFieldChange = (field: keyof typeof paymentForm, value: string) =>
  {
    
    setPaymentForm(prev => ({ ...prev, [field]: value }));
    
    if (paymentStatus !== 'idle')
    {
      setPaymentStatus('idle');
    
    }
  
  };

  const handlePaymentSubmit = (e: React.SubmitEvent<HTMLFormElement>) =>
  {

    e.preventDefault();
    
    const sanitizedCard = paymentForm.cardNumber.replace(/\s+/g, '');
    const isValid = 
                   paymentForm.fullName.trim().length > 1 &&
      
                 /^\S+@\S+\.\S+$/.test(paymentForm.email) &&
      
                        /^\d{13,19}$/.test(sanitizedCard) &&
      
      /^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentForm.expiry) &&
      
                        /^\d{3,4}$/.test(paymentForm.cvv) &&
      
      paymentForm.billingZip.trim().length >= 4;

    if (!isValid)
    {
      setPaymentStatus('error');
      return;
    }

    setPaymentStatus('processing');
    setTimeout(() =>
    {
      setPaymentStatus('complete');
      setPaymentForm(
      {
        fullName: "",
        email: "",
        cardNumber: "",
        expiry: "",
        cvv: "",
        billingZip: ""
      
      });
    
    }, 700);
  
  };


  const addItemToCart = (
    item: 
    { 
      name: string; 
      price: string; 
      quantity?: number 
    
    }) =>
  {
    const quantity = Math.max(1, item.quantity ?? 1);
    
    setStoreCart(prev =>
    {
      const current = prev[item.name];
      return( 
      {
        ...prev,
        [item.name]: 
        {
          name: item.name,
          price: item.price,
          quantity: (current?.quantity ?? 0) + quantity
        }
      
      });
    
    });
  
  };


  const handleModalAddToCart = () =>
  {
    if (!selectedMenuItem)
    {
      return;
    }

    setQuantityInput("1");
    setQuantityFeedback(null);
    setIsQuantityPromptOpen(true);
  
  };


  const submitModalQuantity = () =>
  {
    
    if (!selectedMenuItem)
    {
      return;
    }


    const quantity = Number.parseInt(quantityInput, 10);
    if (!Number.isFinite(quantity) || quantity < 1)
    {
      setQuantityFeedback('Try again');
      return;
    }


    addItemToCart(
    {
      name: selectedMenuItem.name,
      price: selectedMenuItem.price,
      quantity
    
    });
    

    setQuantityFeedback('Success!');
    setTimeout(() =>
    {
      setIsCartOpen(true);
      setActivePage("Menu");
      
      setIsQuantityPromptOpen(false);
      closeMenuDetail();
      
      setQuantityFeedback(null);
    
    }, 500);
  
  };

  
  const removeSingleFromCart = (itemName: string) =>
  {
    setStoreCart(prev =>
    {
      const current = prev[itemName];
      if (!current)
      {
        return prev;
      }

      if (current.quantity <= 1)
      {
        const { [itemName]: _removed, ...rest } = prev;
        return rest;
      }

      return( 
      {
        ...prev,
        [itemName]: 
        {
          ...current,
          quantity: current.quantity - 1
        }
      
      });
    
    });
  
  };

  
  const clearCart = () =>
  {
    setStoreCart({});
  };


  // Navigation handlers
  const goToCheckoutFromCart = () =>
  {
    
    const confirmMessage = coffeeMenuCopy.checkoutConfirm.replace('{num_items}', String(cartCount));
    
    if (!window.confirm(confirmMessage))
    {
      return;
    }
    
    setActivePage(t.subNav["Merchandise"]);
    setIsCartOpen(false);
  
  };


  // Reservation form handlers
  const handleReservationSubmit = (e: React.SubmitEvent<HTMLFormElement>) =>
  {
    e.preventDefault();
    
    if (reservationForm.email.trim() && reservationForm.comments.trim())
    {
      setReservationStatus('success');
      setReservationForm({ email: "", comments: "" });
      setTimeout(() => window.location.reload(), 1500);
    
    }
  
  };


  const openProductPageFromSearch = (type: 'coffee' | 'pastry') =>
  {
    setActivePage(type === 'coffee' ? t.subNav["Coffee"] : t.subNav["Pastries"]);
    setIsSearchDropdownOpen(false);
  
  };


  const navItems = 
  {
    Home: [t.subNav["About Us"], t.subNav["Our Story"], t.subNav["Team"]],
    Products: [t.subNav["Coffee"], t.subNav["Pastries"], t.subNav["Merchandise"]],
    Contact: [t.subNav["Location"], t.subNav["Hours"], t.subNav["Reservations"]]
  
  };


  const contactPagePhotos = 
  {
    Location: 
    {
      image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1200&h=700&fit=crop",
      alt: language === 'es' ? 'Vista exterior de la cafetería' : 
      language === 'ja' ? 'カフェ外観の写真' : 'Coffee shop exterior view'
    
    },
    

    Hours: 
    {
      image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&h=700&fit=crop",
      alt: language === 'es' ? 'Ambiente de café por la mañana' : language === 'ja' ? '朝のカフェの雰囲気' : 'Morning coffeehouse atmosphere'
    
    },
    

    Reservations: 
    {
      image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&h=700&fit=crop",
      alt: language === 'es' ? 'Mesa reservada en cafetería' : language === 'ja' ? '予約席のあるカフェテーブル' : 'Reserved table inside a coffee shop'
    
    }
  
  } as const;

  const homePagePhotos = 
  {
    "About Us": 
    {
      image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&h=700&fit=crop",
      alt: language === 'es' ? 'Interior acogedor de cafetería' : 
      language === 'ja' ? '居心地の良いカフェの内観' : 'Cozy coffee shop interior'
    
    },
    
    "Our Story": 
    {
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=700&fit=crop",
      alt: language === 'es' ? 'Barista preparando café artesanal' : 
      language === 'ja' ? '職人がコーヒーを淹れる様子' : 'Barista crafting artisanal coffee'
    },
    Team: {
      image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&h=700&fit=crop",
      alt: language === 'es' ? 'Equipo de cafetería sonriendo' : language === 'ja' ? 'カフェスタッフのチーム写真' : 'Coffee shop team portrait'
    }
  } as const;

  const menuRusticNotes = {
    Espresso: "Wood-fired roast profile with a deep caramel finish.",
    Cappuccino: "Velvety foam and earthy cocoa warmth in every sip.",
    Latte: "Silky steamed milk layered over a hearth-roasted base.",
    Americano: "Clean and bold with a smooth cabin-brew character.",
    "Golden Morning Croissant": "Butter-laminated layers that crackle and shatter—simple, honest, and perfect.",
    "Farmhouse Blueberry Muffin": "Thick and generous, studded with orchard berries—pure kitchen comfort.",
    "Rustic Almond Biscotti": "Twice-baked crunch, meant for dunking—no pretense, all flavor.",
    "Cabin-Style Chocolate Chunk Cookie": "Chunky, chewy, and still warm—the kind of cookie that feels like home."
  
  } as const;

  const drinks = [
    { 
      name: t.drinks.items["Espresso"].name, 
      price: "$3.50",
      description: t.drinks.items["Espresso"].description,
      rusticDescription: menuRusticNotes.Espresso,
      image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop"
    },

    { 
      name: t.drinks.items["Cappuccino"].name, 
      price: "$4.50",
      description: t.drinks.items["Cappuccino"].description,
      rusticDescription: menuRusticNotes.Cappuccino,
      image: "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400&h=300&fit=crop"
    },

    { 
      name: t.drinks.items["Latte"].name, 
      price: "$4.75",
      description: t.drinks.items["Latte"].description,
      rusticDescription: menuRusticNotes.Latte,
      image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop"
    },

    { 
      name: t.drinks.items["Americano"].name, 
      price: "$3.75",
      description: t.drinks.items["Americano"].description,
      rusticDescription: menuRusticNotes.Americano,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop"
    },
  
  ];

  const pastries = [
    { 
      name: t.pastries.items["Croissant"].name, 
      
      price: "$4.00",
      description: t.pastries.items["Croissant"].description,
      
      rusticDescription: menuRusticNotes["Golden Morning Croissant"],
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop"
    
    },
    
    { 
      name: t.pastries.items["Blueberry Muffin"].name, 
      
      price: "$3.50",
      description: t.pastries.items["Blueberry Muffin"].description,
      
      rusticDescription: menuRusticNotes["Farmhouse Blueberry Muffin"],
      image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=300&fit=crop"
    
    },
    
    { 
      name: t.pastries.items["Almond Biscotti"].name, 
      
      price: "$2.75",
      description: t.pastries.items["Almond Biscotti"].description,
      
      rusticDescription: menuRusticNotes["Rustic Almond Biscotti"],
      image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop"
    
    },
    
    { 
      name: t.pastries.items["Chocolate Chip Cookie"].name, 
      price: "$2.50",
      
      description: t.pastries.items["Chocolate Chip Cookie"].description,
      rusticDescription: menuRusticNotes["Cabin-Style Chocolate Chunk Cookie"],
      
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop"
    
    },
  ];

  const { filteredDrinks, filteredPastries, regexError } = useMemo(() =>
  {
    const query = searchQuery.trim();
    if (!query)
    {
      return (
      {
        filteredDrinks: drinks,
        filteredPastries: pastries,
        regexError: false
      });
    }

    try
    {
      const regex = new RegExp(query, 'i');
      return (
      {
        filteredDrinks: drinks.filter(item => regex.test(item.name) || regex.test(item.description)),
        filteredPastries: pastries.filter(item => regex.test(item.name) || regex.test(item.description)),
        regexError: false
      });
    }
    
    catch
    {
      return (
      {
        filteredDrinks: drinks,
        filteredPastries: pastries,
        regexError: true
      
      });
    }
  
  }, [searchQuery, drinks, pastries]);

  useEffect(() =>
  {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) =>
    {
      const target = event.target as Node;

      if (openDropdown && navRef.current && !navRef.current.contains(target))
      {
        setOpenDropdown(null);
      }

      if (isCartOpen && cartRef.current && !cartRef.current.contains(target))
      {
        setIsCartOpen(false);
      }

      if (isSearchDropdownOpen && searchRef.current && !searchRef.current.contains(target))
      {
        setIsSearchDropdownOpen(false);
      }

      if (isLangMenuOpen && langMenuRef.current && !langMenuRef.current.contains(target))
      {
        setIsLangMenuOpen(false);
        setIsLangMenuPinned(false);
      }
    
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () =>
    {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);

      if (langMenuCloseTimerRef.current !== null)
      {
        window.clearTimeout(langMenuCloseTimerRef.current);
        langMenuCloseTimerRef.current = null;
      }
    
    };
  
  }, [openDropdown, isCartOpen, isSearchDropdownOpen, isLangMenuOpen]);

  useEffect(() =>
  {
    // Fetch a coffee image when Merchandise section is opened
    if (isMerchandiseSection && !coffeeImage)
    {
      setCoffeeImageLoading(true);
      fetch('https://coffee.alexflipnote.dev/random.json')
        .then(res => res.json())
        .then(data =>
        {
          
          if (data.file)
          {
            setCoffeeImage(`https://coffee.alexflipnote.dev/images/${data.file}`);
          }
        
        })
        .catch(() =>
        {
          // Fallback to a default coffee image if API fails
          setCoffeeImage('https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&h=700&fit=crop');
        
        })
        .finally(() => setCoffeeImageLoading(false));
    
    }
  }, [isMerchandiseSection, coffeeImage]);


  useEffect(() =>
  {
    if (activePage === t.subNav["Location"])
    {
      void loadRandomLocation();
    }
  
  }, [activePage]);


  return ( 
    // Updated to a frosted rustic coffeehouse look using brown accents, coffee-toned conic gradients, and a brown-glass search results pane.
    <div className=
    {
      `min-h-screen transition-all duration-300 
      ${isDark ? 'bg-gradient-to-br from-[#1f1610] via-[#2b1f17] to-[#140f0b] text-amber-100' 
      : 'bg-gradient-to-br from-[#f5eee6] via-[#ede0d2] to-[#e3d2bf] text-stone-900'
       }`
    } 
      style=
      {
        isDark ? 
        { 
          '--conic-from': '#7a5230', 
          '--conic-to': '#3f2a1d' 
        
        } as React.CSSProperties : 
        { 
          '--conic-from': '#d8b28a', 
          '--conic-to': '#8c5a36' 
        
        } as React.CSSProperties
      }>
      
      <div ref={cartRef} className="fixed top-4 left-4 z-[70]">
        <button
          type="button"
          onClick={() =>
          {
            setIsCartOpen(prev => !prev);
          }}
          
          className=
          {
            `px-3 py-2 rounded-2xl border backdrop-blur-2xl shadow-xl font-semibold transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 
            ${isDark ? 'bg-[#2b1d14]/65 border-amber-500/50 text-amber-100 hover:bg-[#3a281c]/75' : 
              'bg-[#fff8f0]/75 border-[#c8a27b]/70 text-[#5f3b24] hover:bg-[#f7e8d7]/85'
             }`
          }
          aria-expanded={isCartOpen}
          aria-label="Toggle cart"
        >
          🧺 {coffeeMenuCopy.cartLabel}: {cartCount}
        
        </button>
        
        {isCartOpen && (
          <div className=
          {
            `mt-2 w-72 rounded-2xl border backdrop-blur-3xl shadow-2xl p-4 
              ${isDark ? 'bg-[#2b1d14]/70 border-amber-500/50 text-amber-100' 
              : 'bg-[#fff8f0]/80 border-[#c8a27b]/70 text-[#5f3b24]'
               }`
          
          }>
            <h4 className=
            {
              `font-bold mb-2 
                ${isDark ? 'text-amber-200' : 'text-[#6f4429]'

                }`
            }>{coffeeMenuCopy.basketTitle}</h4>
            
            {cartItems.length === 0 ? (
              
              <p className=
              {
                `${isDark ? 'text-amber-100/75' : 'text-[#7a5a44]'

                  }`
              }>0</p>
            
            ) : (
              
              <ul className="space-y-1 max-h-56 overflow-y-auto">
                
                {cartItems.map((item) => (
                  <li key=
                  {
                    `cart-pill-${item.name}`
                  } 
                  className=
                  {
                    `flex items-center justify-between gap-2 text-sm 
                    ${isDark ? 'text-amber-100/90' : 'text-[#5d412d]'

                     }`
                  }>
                    
                    <span className="flex-1">{item.name} × {item.quantity}</span>
                    <span>{item.price}</span>
                    
                    <button
                      type="button"
                      onClick={() => removeSingleFromCart(item.name)}
                      className=
                      {
                        `w-[10px] h-[10px] flex items-center justify-center rounded-sm text-[8px] leading-none 
                          ${isDark ? 'text-amber-200 hover:bg-amber-700/40' : 'text-[#6f4429] hover:bg-[#d8b28a]/50'}`
                      }
                      aria-label={`Remove one ${item.name}`}
                      title="Remove one"
                    >
                      🗑
                    </button>
                  
                  </li>
                ))}
              
              </ul>
            )}
            <button
              type="button"
              onClick=
              {() =>
                {
                  setActivePage(t.subNav["Coffee"]);
                  setIsCartOpen(false);
                }
              }
              
              className=
              {
                `mt-3 w-full px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] 
                  ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' 
                    : 'bg-[#6f4429] text-amber-100 hover:bg-[#835135]'

                   }`
              }
            >
              {coffeeMenuCopy.goToCoffee}
            
            </button>
            
            <button
              type="button"
              onClick={goToCheckoutFromCart}
              className=
              {
                `mt-2 w-full px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] 
                  ${isDark ? 'bg-amber-500/90 text-[#2b1b0f] hover:bg-amber-400' 
                    : 'bg-[#7c4e2f] text-amber-100 hover:bg-[#8f5b38]'
                   }`
              }
            >
              {coffeeMenuCopy.goToCheckout}
            
            </button>
            
            <button
              type="button"
              onClick={clearCart}
              className=
              {
                `mt-2 w-full px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] 
                  ${isDark ? 'bg-[#4a3325] text-amber-100 hover:bg-[#5b3d2a]' 
                    : 'bg-[#ead8c5] text-[#5f3b24] hover:bg-[#dfc3a8]'
                   }`
                }
              disabled={cartCount === 0}
            >
              
              {coffeeMenuCopy.clearBasket}
            </button>
          
          </div>
        )}
      
      </div>
      
      {/* Navigation Bar */}
      <nav ref={navRef} className=
      {
        `sticky top-0 z-50 py-4 px-6 backdrop-blur-xl border-b transition-all duration-900 
          ${isDark ? 'bg-[#2a1d15]/55 border-amber-700/30 shadow-[0_10px_30px_rgba(101,67,33,0.35)]' 
            : 'bg-[#fffaf4]/45 border-amber-300/45 shadow-[0_10px_35px_rgba(120,72,30,0.16)]'
           }`
      }>
        
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-8">
            
            {Object.entries(navItems).map(([label, items]) =>
            {
              return (
              <div key={label} className="relative">
                <button
                  
                  onClick={() =>
                  {
                    setOpenDropdown(openDropdown === label ? null : label);
                  }}
                  
                  className=
                  {
                    `font-medium py-2 px-4 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-105 flex items-center gap-1 border 
                      ${isDark ? 'text-amber-100 hover:text-amber-200 border-amber-700/35 bg-[#3a291d]/40 hover:bg-[#4a3325]/65' 
                        : 'text-[#5b3a23] hover:text-[#6f4429] border-amber-300/60 bg-[#fffdf9]/50 hover:bg-[#f6e7d6]/70'
                       }`
                  }
                >
                  {t.navItems[label as keyof typeof t.navItems]}
                  <span className="text-xs">{openDropdown === label ? '▲' : '▼'}</span>
                
                </button>
                
                {openDropdown === label &&
                (
                  <div className=
                  {
                    `absolute top-full left-0 mt-2 rounded-2xl shadow-2xl py-2 min-w-[220px] z-50 border backdrop-blur-3xl 
                      ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                        : 'bg-[#fff8f0]/45 border-amber-300/70'
                       }`
                  }>
                    {items.map((item) =>
                    {
                      return (
                      <a
                        key={item}
                        href="#"
                        className=
                        {
                          `block px-4 py-2.5 ${isDark ? 'text-amber-100 hover:bg-[#4b3324]/50 hover:text-amber-200' 
                            : 'text-[#5a3a22] hover:bg-[#efdcc8]/70 hover:text-[#6a4228]'
                                              } transition-colors duration-180 rounded-lg`
                        }
                        
                        onClick={(e) =>
                        {
                          e.preventDefault();
                          setActivePage(item);
                          setOpenDropdown(null);
                        
                        }}
                      
                      >

                        {item}
                      
                      </a>
                      );
                    
                    })}
                  
                  </div>
                )}
              
              </div>
              );
            
            })}
          
          </div>
          

          <div className="flex items-center gap-3">
            
            {/* Language Picker (hover/focus shows language bar) */}
            <div
              ref={langMenuRef}
              className="relative"
              onMouseEnter={openLanguageMenu}
              onMouseLeave={scheduleCloseLanguageMenu}
              onKeyDown={(e) => e.key === 'Escape' && setIsLangMenuOpen(false)}
              tabIndex={-1}
            >
              <button
                onClick={toggleLanguageMenu}
                onFocus={openLanguageMenu}
                aria-haspopup="menu"
                aria-expanded={isLangMenuOpen}
                className=
                {
                  `px-4 py-2 rounded-full border shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 font-semibold 
                    ${isDark ? 'bg-amber-400/85 border-amber-200/40 text-[#2c1b0f] hover:bg-amber-300' 
                      : 'bg-[#5f3b24] border-[#7b4f2f] text-amber-100 hover:bg-[#70472b]'
                     }`
              }
              >
                {/* show current language emoji + code */}
                {
                  language === 'en' ? '🇺🇸 EN' 
                    : language === 'es' ? '🇪🇸 ES' 
                      : language === 'ja' ? '🇯🇵 JA' 
                        : language === 'zh' ? '🇨🇳 ZH' 
                          : language === 'hi' ? '🇮🇳 HI' : 'EN'
                }
              </button>

              {isLangMenuOpen && (
                <div role="menu" aria-label="Select language" className=
                {
                  `absolute right-0 mt-2 rounded-xl shadow-xl py-2 min-w-[160px] z-50 border backdrop-blur-3xl 
                    ${isDark ? 'bg-[#2b1d14]/55 border-amber-700/40' 
                      : 'bg-[#fffaf4]/75 border-amber-300/50'
                     }`
                }>
                  {[
                    { code: 'en', emoji: '🇺🇸', label: 'English' },
                    { code: 'es', emoji: '🇪🇸', label: 'Español' },
                    { code: 'ja', emoji: '🇯🇵', label: '日本語' },
                    { code: 'zh', emoji: '🇨🇳', label: '中文' },
                    { code: 'hi', emoji: '🇮🇳', label: 'हिन्दी' }
                  
                  ].map((lang) =>
                  {
                    const isCurrent = language === (lang.code as Language);
                    return (
                      <button
                        key={lang.code}
                        role="menuitem"
                        onClick={() =>
                        {
                          setLanguage(lang.code as Language);
                          setIsLangMenuOpen(false);
                          setIsLangMenuPinned(false);

                        }}
                        
                        onMouseEnter={openLanguageMenu}
                        onKeyDown={(e) => e.key === 'Escape' && setIsLangMenuOpen(false)}

                        className=
                        {
                          `w-full text-left px-4 py-2 ${isCurrent ? 'font-bold underline' : ''} 
                            ${isDark ? 'text-amber-100 hover:bg-[#4b3324]/40' : 'text-[#5a3a22] hover:bg-[#efdcc8]/70'} 
                              transition-colors duration-150`
                        }
                      >
                        <span className="mr-3">{lang.emoji}</span>
                        <span>{lang.label}</span>
                      </button>
                    );
                  
                  })}
                </div>
              
              )}
            
            </div>
            

            {/* Theme Toggle Button */}
            <button
              
              onClick={() =>
              {
                setIsDark(!isDark);
              
              }}
              
              className=
              {
                `p-3 rounded-full border shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-100 
                ${isDark ? 'bg-[#d4a373]/90 border-[#f2d2af]/40 text-[#2c1b0f] hover:bg-[#e5b686]' 
                  : 'bg-[#ecd7c2] border-[#d4b08c] text-[#6f4429] hover:bg-[#e4c8aa]'
                 }`
              }
              
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            
            </button>
          
          </div>
        
        </div>
      
      </nav>

      {/* Header */}
      <header className=
      {
        `py-12 px-6 text-center transition-all duration-300 
        ${isDark ? 'bg-conic-180' : 'bg-conic'} rounded-2xl mx-6 my-4 border 
        ${isDark ? 'border-amber-700/40' : 'border-amber-300/55'}`
      } 

        style={isDark ? 
        { 
          '--conic-from': '#2b1a10', '--conic-via': '#a67c52', '--conic-to': '#120b07' 

        } as React.CSSProperties : 
        { 
          '--conic-from': '#f4dcc0', '--conic-via': '#be8b5d', '--conic-to': '#6f4429' 

        } as React.CSSProperties}>
        
        <h1 className=
        {
          `text-5xl md:text-8xl font-extrabold mb-3 tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] 
            ${isDark ? 'text-[#f3dfc3]' : 'text-[#deb887]'}`
        
        }>☕ {t.siteName}</h1>
        
        <p className={`${isDark ? 'text-[#e8cda8]' : 'text-[#8b5e3c]'} text-2xl font-semibold`}>{t.tagline}</p>
      
      </header>

      {/* Hero Section */}
      <section className="px-6 pb-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className={`${isDark ? 'text-amber-200/90' : 'text-[#6a4428]'} text-xl font-semibold mb-6`}>
            {t.welcome}
          </p>
          
          
          {/* Search Bar */}
          {activePage === "Menu" && (
            <div ref={searchRef} className="max-w-2xl mx-auto relative">
              <div className="relative">
                
                <input
                  type="text"
                  value={searchQuery}
                  
                  onChange={(e) =>
                  {
                    setSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  
                  onFocus={() =>
                  {
                    setIsSearchDropdownOpen(true);
                  }}
                  
                  placeholder={t.searchPlaceholder}
                  className=
                  {
                    `w-full px-6 py-3 rounded-2xl border shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-2xl 

                    ${regexError ? 'ring-2 ring-red-500' : isDark 
                        ? 'bg-[#2a1d15]/55 border-amber-500/40 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                        : 'bg-[#fff8f0]/55 border-[#c8a27b]/55 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'
                     }`
                  }
                />

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <button
                      
                      onClick={() =>
                      {
                        setSearchQuery("");
                        setIsSearchDropdownOpen(false);
                      }}
                      
                      className=
                      {
                        `text-sm px-3 py-1 rounded-full transition-colors 
                          ${isDark ? 'bg-[#4a3325] text-amber-100 hover:bg-[#5b3d2a]' 
                            : 'bg-[#ead8c5] text-[#5f3b24] hover:bg-[#dfc3a8]'
                           }`
                      }
                    >
                      {t.clear}
                    
                    </button>
                  )}
                  <span className={`text-2xl ${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'}`}>🔍</span>
                
                </div>
              
              </div>
              
              
              {/* Search Results Dropdown */}
              {isSearchDropdownOpen && searchQuery && !regexError && (filteredDrinks.length > 0 || filteredPastries.length > 0) && (
                <div className=
                {
                  `absolute top-full mt-4 w-full rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-50 border backdrop-blur-3xl 
                    ${isDark ? 'bg-[#2b1d14]/50 border-amber-500/45' : 'bg-[#fff8f0]/50 border-[#c8a27b]/60'

                     }`
                }>
                  
                  {filteredDrinks.length > 0 && (
                    <div className={`p-4 border-b ${isDark ? 'border-amber-800/40' : 'border-amber-200/70'}`}>
                      
                      <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>☕ {t.drinks.title}</h3>
                      <div className="space-y-2">
                        
                        {filteredDrinks.map((drink) =>
                        {
                          return (
                          
                          <div 
                            key={drink.name}
                            className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                              isDark ? 'hover:bg-[#4b3324]/45' : 'hover:bg-[#f3e4d4]/70'
                            }`}
                            
                            onClick={() => openProductPageFromSearch('coffee')}
                            onMouseEnter={() => setHoveredItem(drink.name)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <img 
                              src={drink.image} 
                              alt={drink.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            
                            <div className="flex-1">
                              
                              <div className="flex justify-between items-start">
                                
                                <h4 className={`font-semibold ${isDark ? 'text-amber-100' : 'text-[#4b2f1d]'}`}>{drink.name}</h4>
                                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'}`}>{drink.price}</span>
                              
                              </div>
                              
                              <p className={`text-sm ${isDark ? 'text-amber-100/70' : 'text-[#7a5a44]'} line-clamp-2`}>{drink.description}</p>
                            
                            </div>
                          
                          </div>
                          );
                        })}
                      
                      </div>
                    
                    </div>
                  )}
                  
                  {filteredPastries.length > 0 && (
                    <div className="p-4">
                      <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>🥐 {t.pastries.title}</h3>
                      <div className="space-y-2">
                        
                        {filteredPastries.map((pastry) =>
                        {
                          return (
                          
                          <div 
                            key={pastry.name}
                            className=
                            {
                              `flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] 
                                ${isDark ? 'hover:bg-[#4b3324]/45' : 'hover:bg-[#f3e4d4]/70'
                                 }`
                          }
                            
                            onClick={() => openProductPageFromSearch('pastry')}
                            onMouseEnter={() => setHoveredItem(pastry.name)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <img 
                              src={pastry.image} 
                              alt={pastry.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            
                            />
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className={`font-semibold ${isDark ? 'text-amber-100' : 'text-[#4b2f1d]'}`}>{pastry.name}</h4>
                                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'}`}>{pastry.price}</span>
                              </div>
                              
                              <p className={`text-sm ${isDark ? 'text-amber-100/70' : 'text-[#7a5a44]'} line-clamp-2`}>{pastry.description}</p>
                            
                            </div>
                          
                          </div>
                          );
                        })}
                      
                      </div>
                    
                    </div>
                  )}
                
                </div>
              )}
              
              {regexError && (
                <p className="text-red-500 text-sm mt-2">{t.invalidRegex}</p>
              )}
              
              {searchQuery && !regexError && filteredDrinks.length === 0 && filteredPastries.length === 0 && (
                <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'} text-center`}>
                  {t.noResults}
                
                </p>
              )}
            
            </div>
          )}
        
        </div>
      
      </section>

      {/* Main Content */}
      <main className="py-10 px-6 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Dynamic Content Based on Active Page */}
          {activePage !== "Menu" && t.pageContent[activePageKey] ? (
            
            <div className=
            {
              `${isDark ? 'bg-[#2a1d15]/55 border-amber-600/55 shadow-[0_8px_32px_rgba(101,67,33,0.25)]' 
                : 'bg-[#fff9f2]/65 border-[#c8a27b]/60 shadow-[0_8px_32px_rgba(139,94,60,0.15)]'
                } 
                rounded-3xl shadow-2xl p-8 border backdrop-blur-xl transition-colors duration-300`
            }>
              
              <h2 className={`text-3xl font-bold ${isDark ? 'text-amber-200' : 'text-[#6f4429]'} mb-6`}>
                {t.pageContent[activePageKey].title}
              </h2>
              
              {(activePageKey === "Location" || activePageKey === "Hours" || activePageKey === "Reservations") && (
                <img
                  src={contactPagePhotos[activePageKey].image}
                  alt={contactPagePhotos[activePageKey].alt}
                  className="w-full h-56 md:h-72 object-cover rounded-2xl border border-amber-300/40 mb-6"
                />
              )}
              
              {(activePageKey === "About Us" || activePageKey === "Our Story" || activePageKey === "Team") && (
                <img
                  src={homePagePhotos[activePageKey].image}
                  alt={homePagePhotos[activePageKey].alt}
                  className="w-full h-56 md:h-72 object-cover rounded-2xl border border-amber-300/40 mb-6"
                />
              )}
              
              <p className={`${isDark ? 'text-amber-100/90' : 'text-[#5d412d]'} text-lg leading-relaxed whitespace-pre-line`}>
                {t.pageContent[activePageKey].content}
              </p>

              {activePageKey === "Location" && (
                <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className=
                  {
                    `rounded-2xl border p-6 backdrop-blur-2xl 
                      ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                        : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'
                       }`
                  }>
                    <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>
                      Random U.S. Stop
                    </h3>
                    
                    {
                      randomLocationLoading ? (
                      <p className={`${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>
                        Pulling a fresh map pin from RandomCoords...
                      </p>
                    
                  ) : randomLocationError ? (
                      <p className="text-red-500 text-sm">{randomLocationError}</p>
                  
                    ) : randomLocation ? (
                      <>
                        <p className={`text-lg font-semibold ${isDark ? 'text-amber-100' : 'text-[#5d412d]'}`}>
                          {randomLocation.label}
                        
                        </p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-amber-100/75' : 'text-[#7a5a44]'}`}>
                          Latitude {randomLocation.latitude.toFixed(5)} · Longitude {randomLocation.longitude.toFixed(5)}
                        
                        </p>
                        
                        <a
                          href={`https://www.google.com/maps?q=${randomLocation.latitude},${randomLocation.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          
                          className=
                          {
                            `inline-flex mt-4 px-4 py-2 rounded-xl font-semibold transition-all duration-200 
                              ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' 
                                : 'bg-[#6f4429] text-amber-100 hover:bg-[#835135]'}`
                          }
                        >
                          Open in Google Maps
                        </a>
                      </>
                    ) : (
                      <p className={`${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>
                        Loading a map pin now...
                      </p>
                    )}
                  </div>

                  <div className=
                  {
                    `overflow-hidden rounded-2xl border min-h-[320px] 
                      ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                        : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                  }>
                    {randomLocation ? (
                      <iframe
                        title="Random U.S. location map"
                        src={`https://www.google.com/maps?q=${randomLocation.latitude},${randomLocation.longitude}&z=12&output=embed`}
                        className="h-full min-h-[320px] w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="flex h-full min-h-[320px] items-center justify-center px-6 text-center">
                        <p className={`${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>
                          The map will appear here once the coordinates load.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activePageKey === "Our Story" && (
                <div className=
                {
                  `mt-8 rounded-2xl border p-6 backdrop-blur-2xl 
                    ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                      : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                }>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>Scan to Explore</h3>
                      
                      <p className={`text-sm ${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>
                        Scan this QR code to visit the Coffee API that powers our featured coffee selection.
                      </p>
                    
                    </div>
                    <div className={`flex-shrink-0 p-4 rounded-xl ${isDark ? 'bg-white' : 'bg-white'}`}>
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://github.com/AlexFlipnote/CoffeeAPI"
                        alt="QR Code to Coffee API GitHub"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activePageKey === "Team" && (
                <div className=
                {
                  `mt-8 rounded-2xl border p-6 backdrop-blur-2xl 
                    ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                      : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                }>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                      
                      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>✌️ Come Join the Vibe ✌️</h3>
                      
                      <p className={`text-sm ${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>
                        Hey there, beautiful soul! We're all about good energy, great coffee, and spreading the love. 
                        Scan the code to see if you're groovy enough to join our cosmic coffee crew. Peace, love, and lattes! 🌻☕
                      </p>
                    
                    </div>
                    
                    <div className={`flex-shrink-0 p-4 rounded-xl ${isDark ? 'bg-white' : 'bg-white'}`}>
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://coffeecli.com/"
                        alt="QR Code to Coffee CLI"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activePageKey === "Reservations" && (
                <div className=
                {
                  `mt-8 rounded-2xl border p-6 backdrop-blur-2xl 
                    ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                      : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                }>
                  <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>Contact Us</h3>
                  <form onSubmit={handleReservationSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="res-email" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>
                        Email
                      </label>
                      
                      <input
                        id="res-email"
                        
                        type="email"
                        value={reservationForm.email}
                        
                        onChange={(e) => setReservationForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        
                        className=
                        {
                          `w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 
                            ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                              : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'}`
                        }
                        required
                      />
                    </div>
                    
                    <div>
                      
                      <label htmlFor="res-comments" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>
                        Comments
                      </label>
                      
                      <textarea
                        id="res-comments"
                        
                        value={reservationForm.comments}
                        onChange={(e) => setReservationForm(prev => ({ ...prev, comments: e.target.value }))}
                        
                        placeholder="Tell us about your reservation or event..."
                        rows={4}
                        
                        className=
                        {
                          `w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-none 
                            ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                              : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'}`
                        }
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className=
                      {
                        `w-full px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 
                          ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' 
                            : 'bg-[#6f4429] text-amber-100 hover:bg-[#835135]'}`
                      }
                    >
                      Submit
                    </button>
                    {reservationStatus === 'success' && (
                      <p className={`text-center font-medium ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>Thank you! Reloading...</p>
                    
                    )}
                  
                  </form>
                
                </div>
              
              )}
              
                {activePageKey === "Hours" && (
                  <div className=
                  {
                    `mt-8 rounded-2xl border p-6 backdrop-blur-2xl 
                      ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                        : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                  }>
                    
                    <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>Word Search Game</h3>
                    
                    <p className={`text-sm mb-4 ${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>
                      Highlight a word in the grid, then submit it below. Try to uncover: {wordsearchWords.join(', ')}
                    
                    </p>

                    <form onSubmit={handleWordsearchSubmit} className="space-y-4">
                      <div 
                          className=
                          {
                            `inline-block p-4 rounded-lg mb-2 font-mono text-sm leading-8 select-text cursor-text 
                              ${isDark ? 'bg-[#3a291d]/50' : 'bg-white/50'}`
                          }
                        onMouseUp={handleWordsearchSelection}
                      >
                        {wordsearchGrid.map((row, i) => (
                          <div key={i} className="flex gap-2">
                            {row.map((letter, j) => (
                              <span
                                key={`${i}-${j}`}
                                className=
                                {
                                  `w-8 h-8 flex items-center justify-center rounded transition-all 
                                    ${isDark ? 'text-amber-100' : 'text-[#6f4429]'}`
                                }
                              >
                                {letter}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
                        <div>
                          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>
                            Selected word
                          
                          </label>
                          
                          <input
                            type="text"
                            value={selectedWord}
                            placeholder="Select a word from the grid"
                            onChange={(event) => setSelectedWord(event.target.value)}

                            className=
                            {
                              `w-full px-4 py-2.5 rounded-xl border focus:outline-none 
                                ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60' 
                                  : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f]'}`
                            }
                          />
                        </div>
                        <button
                          type="submit"
                          className=
                          {
                            `px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 
                              ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' : 'bg-[#6f4429] text-amber-100 hover:bg-[#835135]'}`
                          }
                        >
                          Submit Word
                        </button>
                      </div>
                    </form>
  
                    {wordsearchFeedback && (
                      <div className=
                      {
                        `mt-4 text-center text-lg font-bold animate-pulse 
                          ${wordsearchFeedback === 'Success' ? (isDark ? 'text-amber-300' : 'text-amber-500') : 'text-red-500'}`
                      }>
                        {wordsearchFeedback}
                      
                      </div>
                    )}

                    {foundWords.size > 0 && (
                      <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-[#3a291d]/50' : 'bg-white/50'}`}>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>
                          Found {foundWords.size}/{wordsearchWords.length} words
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          {wordsearchWords.map(word => (
                            <span
                              key={word}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                foundWords.has(word)
                                  ? (isDark ? 'bg-amber-500 text-white' : 'bg-amber-400 text-white')
                                  : (isDark ? 'bg-[#4a3325] text-amber-200' : 'bg-[#e3d2bf] text-[#6f4429]')
                              }`}
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              {isCoffeeSection && (
                <div className=
                {
                  `mt-8 rounded-2xl border p-6 backdrop-blur-2xl 
                  ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                }>
                  
                  <h3 className=
                  {
                    `text-2xl font-bold mb-4 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`
                  
                  }>{coffeeMenuCopy.menuTitle}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {drinks.map((drink) =>
                    {
                      
                      return (
                      <div
                        key={`coffee-menu-${drink.name}`}
                        role="button"
                        tabIndex={0}
                        
                        onClick={() => openMenuDetail(
                        {
                          
                          name: drink.name,
                          price: drink.price,
                          description: drink.description,
                          
                          rusticDescription: drink.rusticDescription,
                          image: drink.image,
                          section: 'Coffee'
                        
                        })}
                        
                        onKeyDown={(event) =>
                        {
                          if (event.key === 'Enter' || event.key === ' ')
                          {
                            event.preventDefault();
                            openMenuDetail(
                            {
                              
                              name: drink.name,
                              price: drink.price,
                              description: drink.description,
                              
                              rusticDescription: drink.rusticDescription,
                              image: drink.image,
                              section: 'Coffee'
                            
                            });
                          
                          }
                        
                        }}
                        
                        className=
                        {
                          `rounded-xl border p-4 cursor-pointer transition-transform duration-200 hover:scale-[1.01] 
                            ${isDark ? 'bg-[#3a291d]/40 border-amber-700/35' : 'bg-white/70 border-[#d2b191]/60'}`
                        }
                      >
                        <img
                          src={drink.image}
                          alt={drink.name}
                          className="w-full h-36 object-cover rounded-lg mb-3"
                        />
                        
                        <div className="flex items-center justify-between gap-3">
                          <h4 className={`font-semibold ${isDark ? 'text-amber-100' : 'text-[#4b2f1d]'}`}>{drink.name}</h4>
                          <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'}`}>{drink.price}</span>
                        </div>
                        
                        <p className={`mt-2 text-sm ${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>{drink.rusticDescription}</p>
                        
                        <button
                          type="button"
                          onClick={(event) =>
                          {
                            event.stopPropagation();
                            addItemToCart({ name: drink.name, price: drink.price });
                          }}
                          className=
                          {
                            `mt-3 px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 
                              ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' 
                                : 'bg-[#6f4429] text-amber-100 hover:bg-[#835135]'}`
                          }
                        >
                          {coffeeMenuCopy.addToBasket}
                        
                        </button>
                      
                      </div>
                      );
                    })}
                  
                  </div>
                  
                  <div className={`mt-6 rounded-xl border p-4 ${isDark ? 'bg-[#23170f]/50 border-amber-700/35' : 'bg-[#f9efe2]/65 border-[#d2b191]/60'}`}>
                    <h4 className={`font-bold mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>{coffeeMenuCopy.basketTitle}</h4>
                    {cartCount === 0 ? (
                      <p className={`${isDark ? 'text-amber-100/75' : 'text-[#7a5a44]'}`}>0</p>
                    ) : (
                      <ul className="space-y-1">
                        {Object.values(storeCart).map((item) =>
                        {
                          return (
                          <li key={`cart-${item.name}`} className={`flex items-center justify-between gap-2 ${isDark ? 'text-amber-100/90' : 'text-[#5d412d]'}`}>
                            <span className="flex-1">{item.name} × {item.quantity}</span>
                            <span>{item.price}</span>
                            <button
                              type="button"
                              onClick={() => removeSingleFromCart(item.name)}
                              className=
                              {
                                `w-[10px] h-[10px] flex items-center justify-center rounded-sm text-[8px] leading-none 
                                  ${isDark ? 'text-amber-200 hover:bg-amber-700/40' 
                                    : 'text-[#6f4429] hover:bg-[#d8b28a]/50'}`
                              }
                              aria-label={`Remove one ${item.name}`}
                              title="Remove one"
                            >
                              🗑
                            </button>
                          </li>
                          );
                        })}
                      </ul>
                    )}
                    
                    <button
                      type="button"
                      onClick={clearCart}
                      className=
                      {
                        `mt-3 w-full px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] 
                          ${isDark ? 'bg-[#4a3325] text-amber-100 hover:bg-[#5b3d2a]' 
                            : 'bg-[#ead8c5] text-[#5f3b24] hover:bg-[#dfc3a8]'}`
                      }
                      disabled={cartCount === 0}
                    >
                      {coffeeMenuCopy.clearBasket}
                    
                    </button>
                  
                  </div>
                
                </div>
              )}
              {isPastriesSection && (
                <div className=
                {
                  `mt-8 rounded-2xl border p-6 backdrop-blur-2xl 
                    ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                      : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                }>
                  <h3 className=
                  {
                    `text-2xl font-bold mb-4 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`
                  
                  }>{coffeeMenuCopy.pastryMenuTitle}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {
                      pastries.map((pastry) =>
                    {
                      return (
                      <div
                        key={`pastry-menu-${pastry.name}`}
                        role="button"
                        tabIndex={0}
                        
                        onClick={() => openMenuDetail(
                        {
                          
                          name: pastry.name,
                          price: pastry.price,
                          description: pastry.description,
                          
                          rusticDescription: pastry.rusticDescription,
                          image: pastry.image,
                          section: 'Pastries'
                        
                        })}
                        onKeyDown={(event) =>
                        {
                          if (event.key === 'Enter' || event.key === ' ')
                          {
                            event.preventDefault();
                            openMenuDetail(
                            {
                              
                              name: pastry.name,
                              price: pastry.price,
                              description: pastry.description,
                              
                              rusticDescription: pastry.rusticDescription,
                              image: pastry.image,
                              section: 'Pastries'
                            
                            });
                          
                          }
                        
                        }}

                        className=
                        {
                          `rounded-xl border p-4 cursor-pointer transition-transform duration-200 hover:scale-[1.01] 
                            ${isDark ? 'bg-[#3a291d]/40 border-amber-700/35' 
                              : 'bg-white/70 border-[#d2b191]/60'}`
                        }
                      >
                        <img
                          src={pastry.image}
                          alt={pastry.name}
                          className="w-full h-36 object-cover rounded-lg mb-3"
                        
                        />
                        
                        <div className="flex items-center justify-between gap-3">
                          <h4 className={`font-semibold ${isDark ? 'text-amber-100' : 'text-[#4b2f1d]'}`}>{pastry.name}</h4>
                          <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'}`}>{pastry.price}</span>
                        </div>
                        
                        <p className={`mt-2 text-sm ${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>{pastry.rusticDescription}</p>
                        
                        <button
                          type="button"
                          onClick={(event) =>
                          {
                            event.stopPropagation();
                            addItemToCart({ name: pastry.name, price: pastry.price });
                          }}
                          className=
                          {
                            `mt-3 px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 
                              ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' 
                                : 'bg-[#6f4429] text-amber-100 hover:bg-[#835135]'}`
                          }
                        >
                          {coffeeMenuCopy.addToBasket}
                        </button>
                      
                      </div>
                      );
                    
                    })}
                  </div>
                
                </div>
              )}
              {isMerchandiseSection && (
                <>
                  {coffeeImageLoading && (
                    <div className=
                    {
                      `rounded-2xl border p-6 backdrop-blur-2xl 
                        ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                          : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                    }>
                      <p className={`text-center ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>Loading coffee image...</p>
                    </div>
                  )}
                  {coffeeImage && !coffeeImageLoading && (
                    <div className=
                    {
                      `rounded-2xl border overflow-hidden backdrop-blur-2xl 
                        ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                          : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                    }>
                      <img
                        src={coffeeImage}
                        alt="Random coffee"
                        className="w-full h-80 object-cover"
                      />
                      <div className="p-4 text-center">
                        <p className={`text-sm ${isDark ? 'text-amber-200/80' : 'text-[#6f4429]/80'}`}>☕ Featured Coffee</p>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handlePaymentSubmit} 
                  className=
                  {
                    `mt-8 rounded-2xl border p-6 backdrop-blur-2xl 
                      ${isDark ? 'bg-[#2b1d14]/45 border-amber-600/45' 
                        : 'bg-[#fff8f0]/55 border-[#c8a27b]/60'}`
                  }>
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>{paymentCopy.title}</h3>
                    <p className={`${isDark ? 'text-amber-100/80' : 'text-[#6f4d36]'} mb-5`}>{paymentCopy.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={paymentForm.fullName}
                      
                      onChange={(e) =>
                      {
                        onPaymentFieldChange('fullName', e.target.value);
                      }}
                      
                      placeholder={paymentCopy.fullName}
                      className=
                      {
                        `px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 
                          ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                            : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'}`
                      }
                    />
                    <input
                      type="email"
                      value={paymentForm.email}
                      onChange={(e) =>
                      {
                        onPaymentFieldChange('email', e.target.value);
                      }}
                      
                      placeholder={paymentCopy.email}
                      className=
                      {
                        `px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 
                          ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                            : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'}`
                      }
                    />
                    <input
                      type="text"
                      value={paymentForm.cardNumber}
                      onChange={(e) =>
                      {
                        onPaymentFieldChange('cardNumber', e.target.value);
                      }}
                      
                      placeholder={paymentCopy.cardNumber}
                      className=
                      {
                        `md:col-span-2 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 
                          ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                            : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'}`
                      }
                    />
                    <input
                      type="text"
                      value={paymentForm.expiry}
                      onChange={(e) =>
                      {
                        onPaymentFieldChange('expiry', e.target.value);
                      }}
                      placeholder={paymentCopy.expiry}
                      className=
                      {
                        `px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 
                          ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                            : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'}`
                      }
                    />
                    <input
                      type="password"
                      value={paymentForm.cvv}
                      
                      onChange={(e) =>
                      {
                        onPaymentFieldChange('cvv', e.target.value);
                      
                      }}
                      
                      placeholder={paymentCopy.cvv}
                      className=
                      {
                        `px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 
                          ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                            : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'}`
                      }
                    
                    />
                    
                    <input
                      type="text"
                      value={paymentForm.billingZip}
                      onChange=
                      {
                        (e) =>
                      {
                        onPaymentFieldChange('billingZip', e.target.value);
                      }}
                      
                      placeholder={paymentCopy.billingZip}
                      className=
                      {
                        `md:col-span-2 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 
                          ${isDark ? 'bg-[#3a291d]/55 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                            : 'bg-white/70 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'}`
                      }
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className=
                    {
                      `mt-5 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 
                        ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' : 'bg-[#6f4429] text-amber-100 hover:bg-[#835135]'}`
                    }
                    disabled={paymentStatus === 'processing'}
                  >
                    {paymentStatus === 'processing' ? paymentCopy.processing : paymentCopy.submit}
                  </button>
                  
                  {paymentStatus === 'complete' && (
                    <p className={`mt-3 font-medium ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>{paymentCopy.success}</p>
                  )}
                  
                  {paymentStatus === 'error' && (
                    <p className="mt-3 font-medium text-red-500">{paymentCopy.error}</p>
                  )}
                
                </form>
              </>
              )}
              
              
              <button
                onClick={() =>
                {
                  setActivePage("Menu");
                }}
                className={`mt-6 px-6 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 
                ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' : 'bg-[#5f3b24] text-amber-100 hover:bg-[#70472b]'
                }`}
              >
                {t.backToMenu}
              </button>
            
            </div>
          ) : (
            <>
              {/* Drinks */}
              <div className=
              {
                `${isDark ? 'bg-[#2a1d15]/55 border-amber-600/55 shadow-[0_8px_32px_rgba(101,67,33,0.25)]' 
                  : 'bg-[#fff9f2]/65 border-[#c8a27b]/60 shadow-[0_8px_32px_rgba(139,94,60,0.15)]'} 
                    rounded-3xl shadow-2xl p-8 border backdrop-blur-xl transition-colors duration-300`
              }>
                <h2 className={`text-3xl font-bold ${isDark ? 'text-amber-200' : 'text-[#6f4429]'} mb-6`}>☕ {t.drinks.title}</h2>
                
                {filteredDrinks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredDrinks.map((drink) =>
                    {
                      return (
                      <div 
                        key={drink.name} 
                        className="relative"
                        role="button"
                        tabIndex={0}
                        
                        onClick={() => openMenuDetail({
                          name: drink.name,
                          price: drink.price,
                          description: drink.description,
                          
                          rusticDescription: drink.rusticDescription,
                          image: drink.image,
                          section: 'Coffee'
                        
                        })}
                        onKeyDown={(event) =>
                        {
                          if (event.key === 'Enter' || event.key === ' ')
                          {
                            event.preventDefault();
                            openMenuDetail({
                              name: drink.name,
                              price: drink.price,
                              description: drink.description,
                              rusticDescription: drink.rusticDescription,
                              image: drink.image,
                              section: 'Coffee'
                            });
                          }
                        }}
                        
                        onMouseEnter={() =>
                        {
                          setHoveredItem(drink.name);
                        }}
                        
                        onMouseLeave={() =>
                        {
                          setHoveredItem(null);
                        
                        }}
                      >
                        <div className=
                        {
                          `flex justify-between items-center pb-3 border-b ${isDark ? 'border-amber-800/35' : 'border-amber-200/70'} 
                            cursor-pointer transition-all duration-200 transform hover:scale-105 hover:px-2 rounded-xl`
                        }>
                          <span className={`${isDark ? 'text-amber-100' : 'text-[#4b2f1d]'} font-medium`}>{drink.name}</span>
                          <span className={`${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'} font-semibold`}>{drink.price}</span>
                        </div>
                        
                        {hoveredItem === drink.name && (
                          <div className=
                          {
                            `absolute left-full ml-4 top-0 w-80 ${isDark ? 'bg-[#2b1d14]/75' : 'bg-[#fff8f0]/75'} 
                              rounded-2xl shadow-2xl p-4 z-50 border backdrop-blur-xl 
                                ${isDark ? 'border-amber-600/55' : 'border-[#c8a27b]/60'} animate-fadeIn`
                          }>
                            <img 
                              src={drink.image} 
                              alt={drink.name} 
                              className="w-full h-48 object-cover rounded-lg mb-3"
                            />
                            
                            <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>{drink.name}</h3>
                            <p className={`text-sm ${isDark ? 'text-amber-100/90' : 'text-[#5d412d]'}`}>{drink.description}</p>
                          
                          </div>
                        )}
                      
                      </div>
                      );
                    })}
                  
                  </div>
                ) : (
                  
                  <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-500'} py-4`}>
                    No drinks match your search.
                  </p>
                
                )}
              
              </div>

              {/* Pastries */}
              <div className=
              {
                `${isDark ? 'bg-[#2a1d15]/55 border-amber-600/55 shadow-[0_8px_32px_rgba(101,67,33,0.25)]' 
                  : 'bg-[#fff9f2]/65 border-[#c8a27b]/60 shadow-[0_8px_32px_rgba(139,94,60,0.15)]'} 
                    rounded-3xl shadow-2xl p-8 border backdrop-blur-xl transition-colors duration-300`
              }>
                <h2 className=
                {
                  `text-3xl font-bold 
                    ${isDark ? 'text-amber-200' : 'text-[#6f4429]'} mb-6`
                    
                }>🥐 {t.pastries.title}</h2>
                
                {filteredPastries.length > 0 ? (
                  <div className="space-y-4">
                    
                    {filteredPastries.map((pastry) =>
                    {
                      return (
                      <div 
                        key={pastry.name} 
                        className="relative"
                        role="button"
                        tabIndex={0}
                        
                        onClick={() => openMenuDetail(
                        {                        
                          name: pastry.name,
                          price: pastry.price,
                          description: pastry.description,
                          
                          rusticDescription: pastry.rusticDescription,
                          image: pastry.image,
                          section: 'Pastries'
                        
                        })}

                        onKeyDown={(event) =>
                        {
                          if (event.key === 'Enter' || event.key === ' ')
                          {
                            event.preventDefault();
                            openMenuDetail(
                            {
                              name: pastry.name,
                              price: pastry.price,
                              description: pastry.description,
                              rusticDescription: pastry.rusticDescription,
                              image: pastry.image,
                              section: 'Pastries'
                            });
                          }
                        }}
                        
                        onMouseEnter={() =>
                        {
                          setHoveredItem(pastry.name);
                        }}
                        
                        onMouseLeave={() =>
                        {
                          setHoveredItem(null);
                        
                        }}
                      >
                        
                        <div className=
                        {
                          `flex justify-between items-center pb-3 border-b 
                            ${isDark ? 'border-amber-800/35' : 'border-amber-200/70'} 
                              cursor-pointer transition-all duration-200 transform hover:scale-105 hover:px-2 rounded-xl`
                        }>
                          <span className={`${isDark ? 'text-amber-100' : 'text-[#4b2f1d]'} font-medium`}>{pastry.name}</span>
                          <span className={`${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'} font-semibold`}>{pastry.price}</span>
                        </div>



                        {hoveredItem === pastry.name && (
                          <div className=
                          {
                            `absolute left-full ml-4 top-0 w-80 
                              ${isDark ? 'bg-[#2b1d14]/75' : 'bg-[#fff8f0]/75'} 
                                rounded-2xl shadow-2xl p-4 z-50 border backdrop-blur-xl 
                                  ${isDark ? 'border-amber-600/55' : 'border-[#c8a27b]/60'} animate-fadeIn`
                          }>
                            
                            <img 
                              src={pastry.image} 
                              alt={pastry.name} 
                              className="w-full h-48 object-cover rounded-lg mb-3"
                            />
                            
                            <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>{pastry.name}</h3>
                            <p className={`text-sm ${isDark ? 'text-amber-100/90' : 'text-[#5d412d]'}`}>{pastry.description}</p>
                          
                          </div>
                        )}
                      
                      </div>
                      );
                    })}
                  
                  </div>
                ) : (
                  <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-500'} py-4`}>
                    No pastries match your search.
                  </p>
                )}
              
              </div>
            
            </>
          )}
        </div>
      
      
      
      </main>
      {selectedMenuItem && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/55 backdrop-blur-sm"
          onClick={closeMenuDetail}
        >
          <div
            className=
            {
              `relative w-full max-w-2xl rounded-3xl border p-6 shadow-2xl 
                ${isDark ? 'bg-[#241811] border-amber-600/55 text-amber-100' 
                  : 'bg-[#fff8f0] border-[#c8a27b]/70 text-[#5f3b24]'
                 
                 }`
            }
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeMenuDetail}
              className=
              {
                `absolute right-4 top-4 rounded-full px-3 py-1 text-sm font-semibold transition-colors 
                  ${isDark ? 'bg-[#4a3325] text-amber-100 hover:bg-[#5b3d2a]' 
                    : 'bg-[#ead8c5] text-[#5f3b24] hover:bg-[#dfc3a8]'
                   }`
              }
              aria-label="Close item details"
            >
              ✕
            </button>

            <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] items-start">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'}`}>
                  ✌️ Groovy little menu peek ✌️
                </p>
                <h3 className={`text-3xl font-bold mb-3 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>
                  {selectedMenuItem.name}
                </h3>
                <p className={`text-lg font-semibold mb-4 ${isDark ? 'text-amber-300' : 'text-[#8b5e3c]'}`}>
                  {selectedMenuItem.price}
                </p>
                <p className={`text-base leading-relaxed mb-4 ${isDark ? 'text-amber-100/90' : 'text-[#5d412d]'}`}>
                  {selectedMenuItem.section === 'Coffee'
                    ? `This cup is all mellow rhythms and sunbeam vibes. ${selectedMenuItem.rusticDescription} ${selectedMenuItem.description}`
                    : `This little pastry is a peace-sign of comfort and sweetness. ${selectedMenuItem.rusticDescription} ${selectedMenuItem.description}`}
                </p>
                <div className={`rounded-2xl border p-4 ${isDark ? 'bg-[#321f16]/60 border-amber-700/35' : 'bg-white/70 border-[#d2b191]/60'}`}>
                  <p className={`text-sm ${isDark ? 'text-amber-100/80' : 'text-[#6a4b35]'}`}>
                    {selectedMenuItem.section === 'Coffee'
                      ? 'Want to cruise straight to the coffee lineup?'
                      : 'Want to cruise straight to the pastry lineup?'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleModalAddToCart}
                      className=
                      {
                        `px-4 py-2 rounded-xl font-semibold transition-all duration-200 
                          ${isDark ? 'bg-amber-500 text-[#2b1b0f] hover:bg-amber-400' 
                            : 'bg-[#8b5e3c] text-amber-100 hover:bg-[#9a6948]'
                           }`
                      }
                    >
                      Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                      {
                        setActivePage(t.subNav["Coffee"]);
                        closeMenuDetail();
                      }}
                      className=
                      {
                        `px-4 py-2 rounded-xl font-semibold transition-all duration-200 
                          ${isDark ? 'bg-amber-400 text-[#2b1b0f] hover:bg-amber-300' 
                            : 'bg-[#6f4429] text-amber-100 hover:bg-[#835135]'
                           }`
                    }
                    >
                      Go to Coffee
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                      {
                        setActivePage(t.subNav["Pastries"]);
                        closeMenuDetail();
                      }}
                      className=
                      {
                        `px-4 py-2 rounded-xl font-semibold transition-all duration-200 
                          ${isDark ? 'bg-[#4a3325] text-amber-100 hover:bg-[#5b3d2a]' 
                            : 'bg-[#ead8c5] text-[#5f3b24] hover:bg-[#dfc3a8]'
                           }`
                      }
                    >
                      Go to Pastries
                    </button>
                  </div>
                  {isQuantityPromptOpen && selectedMenuItem && (
                    <div className={`mt-4 rounded-2xl border p-4 ${isDark ? 'bg-[#241811]/90 border-amber-700/35' : 'bg-[#fffaf4]/95 border-[#d2b191]/60'}`}>
                      <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-amber-200' : 'text-[#6f4429]'}`}>
                        How many {selectedMenuItem.name.toLowerCase()}s would you like to add?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                        <div className="flex-1">
                          <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-amber-100/80' : 'text-[#7a5a44]'}`}>
                            Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={quantityInput}
                            onChange={(event) =>
                            {
                              setQuantityInput(event.target.value);
                              setQuantityFeedback(null);
                            }}
                            className=
                            {
                              `w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 
                                ${isDark ? 'bg-[#3a291d]/65 border-amber-700/45 text-amber-100 placeholder-amber-100/60 focus:ring-amber-400' 
                                  : 'bg-white/80 border-[#c8a27b]/60 text-[#4b2f1d] placeholder-[#8b6a4f] focus:ring-[#b67d4a]'
                                 }`
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={submitModalQuantity}
                            className=
                            {
                              `px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 
                                ${isDark ? 'bg-amber-500 text-[#2b1b0f] hover:bg-amber-400' 
                                  : 'bg-[#8b5e3c] text-amber-100 hover:bg-[#9a6948]'
                                 }`
                            }
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                            {
                              setIsQuantityPromptOpen(false);
                              setQuantityFeedback(null);
                            }}
                            className=
                            {
                              `px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 
                                ${isDark ? 'bg-[#4a3325] text-amber-100 hover:bg-[#5b3d2a]' 
                                  : 'bg-[#ead8c5] text-[#5f3b24] hover:bg-[#dfc3a8]'
                                 }`
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      {quantityFeedback && (
                        <p className={`mt-3 text-sm font-semibold ${quantityFeedback === 'Success!' ? (isDark ? 'text-amber-300' : 'text-amber-600') : 'text-red-500'}`}>
                          {quantityFeedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-amber-700/35 bg-[#321f16]/50' : 'border-[#d2b191]/60 bg-white/70'}`}>
                <img
                  src={selectedMenuItem.image}
                  alt={selectedMenuItem.name}
                  className="h-full w-full object-cover min-h-[280px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className=
      {
        `py-8 px-6 text-center mt-12 border-t backdrop-blur-3xl 
          ${isDark ? 'bg-[#2a1d15]/55 border-amber-700/35 text-amber-100 shadow-[0_-8px_32px_rgba(101,67,33,0.2)]' 
            : 'bg-[#f2e2cf]/60 border-[#b18864] text-[#4b2f1d] shadow-[0_-15px_32px_rgba(139,94,60,0.12)]'
           }`
      }>
        <p className="text-lg font-semibold">📍 {t.footer.address} | ☎️ {t.footer.phone}</p>
        <p className={`${isDark ? 'text-amber-100/70' : 'text-[#7a5a44]'} mt-2`}>{t.footer.hours}</p>
      </footer>
    </div>
  
  );
}
