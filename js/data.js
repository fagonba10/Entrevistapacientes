/* Catálogos basados en tus plantillas PDF (diario dietético, frecuencia de consumo y actividad física) */
window.DATA = {};

/* ---------- ACTIVIDAD FÍSICA ---------- */
DATA.activities = [
  {k:"dormir", l:"Dormir"},
  {k:"tumbado", l:"Tumbado en reposo"},
  {k:"tv", l:"Ver la TV, escuchar la radio"},
  {k:"leer", l:"Leer, escribir sentado"},
  {k:"coser", l:"Coser, labores manuales"},
  {k:"depie", l:"Estar de pie, charlar, esperar"},
  {k:"comer", l:"Comer (incluir todas las comidas)"},
  {k:"hogar_esp", l:"Realizar tareas del hogar", spec:"Especifica cuáles"},
  {k:"pasear", l:"Pasear, andar"},
  {k:"compra", l:"Hacer la compra"},
  {k:"hogar", l:"Tareas del hogar"},
  {k:"jardin", l:"Jardinería o actividades similares"},
  {k:"escaleras", l:"Subir y bajar escaleras"},
  {k:"bailar", l:"Bailar"},
  {k:"deporte", l:"Gimnasio, deporte", spec:"Especifica qué deporte"},
  {k:"trabajo", l:"Trabajo del paciente", spec:"Especifica tu trabajo"}
];
DATA.actOtrasN = 6;

/* ---------- DIARIO ---------- */
DATA.days = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
DATA.meals = [
  {k:"desayuno", l:"Desayuno", ic:"☕", cat:"des"},
  {k:"almuerzo", l:"Media mañana", ic:"🍎", cat:"snack"},
  {k:"comida", l:"Comida", ic:"🍽️", cat:"main"},
  {k:"merienda", l:"Merienda", ic:"🥪", cat:"snack"},
  {k:"cena", l:"Cena", ic:"🌙", cat:"main"}
];
const O = {
  leche:["Entera","Semidesnatada","Desnatada"],
  tost:["Normal","Integral","Sin sal"],
  merm:["Normal","Sin azúcar"],
  aceite:["Oliva refinado","Oliva virgen extra","Girasol","Otros"],
  mant:["Normal","Light"],
  cer:["Normal","Muesli","Con fibra","Otros"],
  zumo:["Natural","Comercial","Comercial sin azúcar"],
  gall:["Normal","Integral","Con cereales","Otras"],
  pan:["Blanco","Integral","Fibra","Otros"],
  sand:["Blanco","Integral","Multicereales","Otros"],
  veg:["Soja","Almendra","Avena","Otras"],
  cola:["Normal","Light"],
  azu:["Blanca","Moreno"],
  miel:["Romero","Azahar","Multifloral","Otras"],
  barr:["Frutos secos","Proteínicas","De cereales","Otras"],
  fruta:["Natural","En su jugo","En almíbar"],
  yog:["Normal","Desnatado","Con frutas","Otros"],
  fs:["Avellana","Almendras","Nueces","Otros"],
  fiam:["Bacon","Jamón serrano","Jamón pavo/pollo","Otros"],
  queso:["Burgos","Untar","Semicurado","Otros"],
  bna:["Agua","Refrescos","Infusión/café","Otras"],
  bal:["Vino","Cerveza","Destilados","Otras"]
};
const LECHE=["Leche de vaca",O.leche], TOST=["Tostadas (biscotes)",O.tost], MERM=["Mermelada",O.merm],
 ACE=["Aceite",O.aceite], MANT=["Mantequilla / margarina",O.mant], ZUMO=["Zumo",O.zumo],
 GALL=["Galletas",O.gall], PAN=["Pan de barra",O.pan], BARR=["Barritas energéticas",O.barr],
 FRUTA=["Fruta",O.fruta], YOG=["Yogur",O.yog], FS=["Frutos secos",O.fs],
 FIAM=["Fiambre",O.fiam], QUE=["Queso",O.queso], BNA=["Bebidas no alcohólicas",O.bna], BAL=["Bebidas alcohólicas",O.bal];
DATA.catalog = {
  des:[LECHE,TOST,MERM,ACE,MANT,["Cereales",O.cer],ZUMO,GALL,PAN,["Pan especial tipo sándwich",O.sand],
       ["Bebida vegetal",O.veg],["Cola Cao / Nesquik",O.cola],["Azúcar",O.azu],["Miel",O.miel],BARR,FRUTA,YOG,FS,FIAM,QUE,BNA],
  snack:[LECHE,TOST,MERM,ACE,MANT,ZUMO,GALL,PAN,BARR,FRUTA,YOG,FS,FIAM,QUE,BAL,BNA],
  main:[["Primer plato",["Verdura cocida","Verdura a la plancha","Puré de verduras","Ensalada"],"plato"],
        ["Segundo plato",["Pasta","Arroz","Legumbres","Sopa"],"plato"],
        ["Tercer plato",["Pescado blanco","Pescado azul","Carne blanca","Carne roja"],"plato"],
        ["Postre",["Yogur","Fruta","Flan","Tarta"]],
        ["Picoteo",["Moluscos","Fiambre","Frutos secos","Snacks"]],
        ACE,["Pan",["Blanco","Integral","Fibra","Sándwich"]],
        ["Bebidas alcohólicas",["Vino","Cerveza","Destilados","Licores"]],BNA]
};

/* ---------- FRECUENCIA DE CONSUMO ---------- */
DATA.freq = [
 {t:"Lácteos", i:["Leche entera","Leche semidesnatada","Leche desnatada","Leche en polvo","Leche condensada","Yogur entero","Yogur de sabores","Leche fermentada","Cuajada","Flan","Natillas","Queso fresco / requesón","Queso tipo “petit”","Queso semicurado","Queso curado","Queso fundido","Batidos","Otros lácteos"]},
 {t:"Carnes y embutidos", i:["Carne de pollo","Carne de cerdo","Carne de cordero","Carne de vaca","Carne de ternera","Caza","Carne picada","Salchichas","Vísceras","Jamón","Chorizo / salchichón","Otros embutidos","Otras carnes"]},
 {t:"Pescados y mariscos", i:["Merluza","Pescadilla","Lenguado","Trucha","Salmón","Atún / bonito","Sardina","Calamares","Moluscos","Pescado / marisco enlatado","Otros pescados / mariscos"]},
 {t:"Huevos", i:["Huevos fritos","Huevos cocidos","Huevos en tortilla","Otros huevos"]},
 {t:"Cereales, pan y pasta", i:["Cereales del desayuno","Pan blanco","Pan integral","Pan de molde","Arroz","Fideos / macarrones","Espaguetis","Lasaña","Otros cereales"]},
 {t:"Legumbres", i:["Alubias","Garbanzos","Lentejas","Otras legumbres"]},
 {t:"Verduras y hortalizas", i:["Lechuga","Escarola","Tomate crudo","Zanahoria cruda","Pimiento crudo","Cebolla cruda","Otros vegetales crudos","Espinacas cocidas","Acelgas","Judías verdes","Calabacín / calabaza","Coles","Puerros","Patatas","Espárragos / alcachofas","Setas / champiñones","Tomate cocinado","Zanahoria cocinada","Cebolla cocinada","Pimiento cocinado"]},
 {t:"Frutas y zumos", i:["Aguacate","Albaricoque","Cerezas / guindas","Ciruelas","Fresa","Higos","Lima","Limón","Mandarina","Manzana","Melocotón","Melón","Membrillo","Naranja","Níspero","Pera","Piña","Plátano","Sandía","Uvas","Aceitunas","Melocotón en almíbar","Piña en almíbar","Otras frutas en almíbar","Membrillo y pasta de fruta","Zumo natural","Zumo envasado"]},
 {t:"Frutos secos", i:["Almendras / avellanas","Pipas","Cacahuetes","Castañas","Ciruelas secas / pasas","Dátiles","Higos secos"]},
 {t:"Grasas y aceites", i:["Aceite de oliva","Aceite de girasol","Mantequilla","Margarina","Mayonesa","Tocino / manteca","Nata"]},
 {t:"Dulces y golosinas", i:["Azúcar","Miel","Mermelada","Chocolate","Pasteles","Churros","Turrón","Helados","Otros dulces","Galletas","Galletas rellenas","Chicle","Otras golosinas"]},
 {t:"Snacks salados", i:["Palomitas","Patatas fritas","Otros snacks salados"]},
 {t:"Bebidas", i:["Refrescos sin gas","Refrescos con gas","Bebidas de cola","Cerveza sin alcohol","Cerveza con alcohol","Vino","Sidra / cava","Vermut","Ginebra / whisky","Licores","Otras bebidas sin alcohol","Otras bebidas con alcohol","Agua","Bebidas deportivas"]},
 {t:"Salsas y precocinados", i:["Kétchup","Mostaza","Croquetas","Empanadillas","San Jacobo","Empanada","Pizza","Otros precocinados","Otros"]},
 {t:"Sal", i:["Sal convencional","Sal yodada","Sal fluorada"]},
 {t:"Suplementos y complementos", i:["Suplementos de fibra","Germen de trigo","Levadura de cerveza","Polen","Preparados dietéticos","Suplementos de vitaminas","Suplementos minerales","Polivitamínico mineral","Otros complementos"]}
];
DATA.freqOtrosN = 5;
DATA.freqOpts = [["d2","Más de una vez al día"],["d1","Una vez al día"],["s46","4–6 veces por semana"],["s23","2–3 veces por semana"],["s1","Una vez por semana"],["m13","1–3 veces al mes"],["rara","Menos de una vez al mes"]];

/* ---------- COMIDAS HABITUALES ---------- */
DATA.diasOpts = [["d7","Todos los días"],["d56","5–6 días a la semana"],["d34","3–4 días a la semana"],["d12","1–2 días a la semana"],["d0","Casi nunca / no la hago"]];
DATA.mealQ = {desayuno:"¿Qué sueles desayunar?", almuerzo:"¿Qué sueles tomar a media mañana?", comida:"¿Qué sueles comer?", merienda:"¿Qué sueles merendar?", cena:"¿Qué sueles cenar?"};
