import { p as persist } from "./index-DI8hnspe.js";
import { c as create } from "./zustand-DnVmcEKu.js";
const DEFAULT_TTS_ADVANCED_SETTINGS = {
  audioChunkDuration: 15,
  audioChunkThreshold: 30,
  guidanceScale: 2,
  tShift: 0.1,
  positionTemperature: 5,
  classTemperature: 0,
  layerPenaltyFactor: 5,
  denoise: true,
  preprocessPrompt: true,
  postprocessOutput: true,
  padDuration: 0.1,
  fadeDuration: 0.1
};
const useTtsStore = create()(
  persist(
    (set) => ({
      selectedEngineId: "omnivoice",
      selectedModelId: "omnivoice-main",
      text: "",
      instruction: "",
      mode: "clone",
      language: "vi",
      savedLanguages: [],
      speed: 1,
      numStep: 24,
      splitMode: "default",
      capcutLanguage: "vi-VN",
      capcutVoiceType: "BV421_vivn_streaming",
      geminiLanguage: "vi-VN",
      geminiVoiceName: "Puck",
      geminiStyle: "",
      geminiTemperature: 1,
      vbeeVoiceCode: "hn_female_ngochuyen_full_48k-fhg",
      vbeeVoiceName: "HN - Ngọc Huyền",
      vbeeAudioType: "mp3",
      vbeeBitrate: 128,
      vieneuVoice: "Trúc Ly",
      vieneuStyle: "tu_nhien",
      vbeeFavoriteVoiceCodes: [],
      advancedEnabled: false,
      advancedSettings: { ...DEFAULT_TTS_ADVANCED_SETTINGS },
      voiceProfiles: [],
      history: [],
      hasSeenModelPrompt: false,
      setSelectedEngineId: (selectedEngineId) => set({ selectedEngineId }),
      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
      setText: (text) => set({ text }),
      setInstruction: (instruction) => set({ instruction }),
      setMode: (mode) => set({ mode }),
      setLanguage: (language) => set({ language }),
      addSavedLanguage: (language) => set((state) => ({
        savedLanguages: [
          ...state.savedLanguages.filter((item) => item.code !== language.code),
          language
        ].sort((left, right) => left.name.localeCompare(right.name))
      })),
      removeSavedLanguage: (code) => set((state) => ({
        savedLanguages: state.savedLanguages.filter((language) => language.code !== code),
        language: state.language === code ? "auto" : state.language
      })),
      setSpeed: (speed) => set({ speed }),
      setNumStep: (numStep) => set({ numStep }),
      setSplitMode: (splitMode) => set({ splitMode }),
      setCapcutLanguage: (capcutLanguage) => set({ capcutLanguage }),
      setCapcutVoiceType: (capcutVoiceType) => set({ capcutVoiceType }),
      setGeminiLanguage: (geminiLanguage) => set({ geminiLanguage }),
      setGeminiVoiceName: (geminiVoiceName) => set({ geminiVoiceName }),
      setGeminiStyle: (geminiStyle) => set({ geminiStyle }),
      setGeminiTemperature: (geminiTemperature) => set({ geminiTemperature }),
      setVbeeVoiceCode: (vbeeVoiceCode) => set({ vbeeVoiceCode }),
      setVbeeVoiceName: (vbeeVoiceName) => set({ vbeeVoiceName }),
      toggleVbeeFavoriteVoice: (voiceCode) => set((state) => ({
        vbeeFavoriteVoiceCodes: state.vbeeFavoriteVoiceCodes.includes(voiceCode) ? state.vbeeFavoriteVoiceCodes.filter((code) => code !== voiceCode) : [voiceCode, ...state.vbeeFavoriteVoiceCodes]
      })),
      setVbeeAudioType: (vbeeAudioType) => set({ vbeeAudioType }),
      setVbeeBitrate: (vbeeBitrate) => set({ vbeeBitrate }),
      setVieneuVoice: (vieneuVoice) => set({ vieneuVoice }),
      setVieneuStyle: (vieneuStyle) => set({ vieneuStyle }),
      setAdvancedEnabled: (advancedEnabled) => set({ advancedEnabled }),
      setAdvancedSetting: (key, value) => set((state) => ({
        advancedSettings: { ...state.advancedSettings, [key]: value }
      })),
      resetAdvancedSettings: () => set({ advancedSettings: { ...DEFAULT_TTS_ADVANCED_SETTINGS } }),
      setSelectedProfileId: (selectedProfileId) => set({ selectedProfileId }),
      addVoiceProfile: (profile) => set((state) => ({
        voiceProfiles: [profile, ...state.voiceProfiles.filter((item) => item.id !== profile.id)],
        selectedProfileId: profile.id
      })),
      removeVoiceProfile: (id) => set((state) => ({
        voiceProfiles: state.voiceProfiles.filter((item) => item.id !== id),
        selectedProfileId: state.selectedProfileId === id ? void 0 : state.selectedProfileId
      })),
      addHistory: (item) => set((state) => ({ history: [item, ...state.history].slice(0, 100) })),
      renameHistory: (id, name) => set((state) => ({
        history: state.history.map((item) => item.id === id ? { ...item, name } : item)
      })),
      removeHistory: (id) => set((state) => ({ history: state.history.filter((item) => item.id !== id) })),
      markModelPromptSeen: () => set({ hasSeenModelPrompt: true })
    }),
    {
      name: "tts-voice-store-v1",
      version: 12,
      migrate: (persisted) => {
        const state = persisted || {};
        return {
          ...state,
          selectedEngineId: state.selectedEngineId || "omnivoice",
          selectedModelId: state.selectedModelId || "omnivoice-main",
          mode: state.mode || "clone",
          language: state.language || "vi",
          savedLanguages: state.savedLanguages || [],
          speed: state.speed || 1,
          numStep: state.numStep || 24,
          splitMode: state.splitMode || (state.readByLine ? "line" : "default"),
          capcutLanguage: state.capcutLanguage || "vi-VN",
          capcutVoiceType: state.capcutVoiceType || "BV421_vivn_streaming",
          geminiLanguage: state.geminiLanguage || "vi-VN",
          geminiVoiceName: state.geminiVoiceName || "Puck",
          geminiStyle: state.geminiStyle || "",
          geminiTemperature: Number.isFinite(state.geminiTemperature) ? state.geminiTemperature : 1,
          vbeeVoiceCode: state.vbeeVoiceCode || "hn_female_ngochuyen_full_48k-fhg",
          vbeeVoiceName: state.vbeeVoiceName || "HN - Ngọc Huyền",
          vbeeFavoriteVoiceCodes: state.vbeeFavoriteVoiceCodes || [],
          vbeeAudioType: state.vbeeAudioType || "mp3",
          vbeeBitrate: state.vbeeBitrate || 128,
          vieneuVoice: state.vieneuVoice || "Trúc Ly",
          vieneuStyle: state.vieneuStyle || "tu_nhien",
          advancedEnabled: state.advancedEnabled || false,
          advancedSettings: {
            ...DEFAULT_TTS_ADVANCED_SETTINGS,
            ...state.advancedSettings || {}
          },
          selectedProfileId: void 0
        };
      }
    }
  )
);
const languageMapSource = "language_id	language_name	iso_639_3_id	train_data_duration\r\naae	Arbëreshë Albanian	aae	6.11\r\naal	Afade	aal	10.19\r\naao	Algerian Saharan Arabic	aao	2.02\r\nab	Abkhazian	abk	57.27\r\nabb	Bankon	abb	11.2\r\nabn	Abua	abn	10.27\r\nabr	Abron	abr	9.22\r\nabs	Ambonese Malay	abs	10.03\r\nabv	Baharna Arabic	abv	10.41\r\nacm	Mesopotamian Arabic	acm	3.78\r\nacw	Hijazi Arabic	acw	22.32\r\nacx	Omani Arabic	acx	22.03\r\nadf	Dhofari Arabic	adf	0.31\r\nadx	Amdo Tibetan	adx	56.94\r\nady	Adyghe	ady	32.6\r\naeb	Tunisian Arabic	aeb	21.63\r\naec	Saidi Arabic	aec	9.28\r\naf	Afrikaans	afr	4.4\r\nafb	Gulf Arabic	afb	98.55\r\nafo	Eloyi	afo	11.21\r\nahl	Igo	ahl	9.22\r\nahs	Ashe	ahs	10.62\r\najg	Aja (Benin)	ajg	5.63\r\naju	Judeo-Moroccan Arabic	aju	7.21\r\nala	Alago	ala	11.04\r\naln	Gheg Albanian	aln	3.92\r\nalo	Larike-Wakasihu	alo	9.97\r\nam	Amharic	amh	12.83\r\namu	Guerrero Amuzgo	amu	10.1\r\nan	Aragonese	arg	16.4\r\nanc	Ngas	anc	10.14\r\nank	Goemai	ank	10.0\r\nanp	Angika	anp	10.65\r\nanw	Anaang	anw	9.65\r\naom	Ömie	aom	8.19\r\napc	Levantine Arabic	apc	15.65\r\napd	Sudanese Arabic	apd	9.93\r\narb	Standard Arabic	arb	1483.53\r\narq	Algerian Arabic	arq	9.64\r\nars	Najdi Arabic	ars	203.54\r\nary	Moroccan Arabic	ary	104.67\r\narz	Egyptian Arabic	arz	23.23\r\nas	Assamese	asm	270.85\r\nast	Asturian	ast	8.48\r\navl	Eastern Egyptian Bedawi Arabic	avl	1.86\r\nawo	Awak	awo	10.22\r\nayl	Libyan Arabic	ayl	20.13\r\nayp	North Mesopotamian Arabic	ayp	10.92\r\naz	Azerbaijani	aze	9.84\r\nba	Bashkir	bak	249.1\r\nbag	Tuki	bag	10.97\r\nbas	Basa (Cameroon)	bas	10.66\r\nbax	Bamun	bax	10.24\r\nbba	Baatonum	bba	10.53\r\nbbj	Ghomálá'	bbj	7.32\r\nbbl	Bats	bbl	11.22\r\nbbu	Kulung (Nigeria)	bbu	10.39\r\nbce	Bamenyam	bce	9.9\r\nbci	Baoulé	bci	10.21\r\nbcs	Kohumono	bcs	10.45\r\nbcy	Bacama	bcy	9.94\r\nbda	Bayot	bda	9.47\r\nbde	Bade	bde	9.89\r\nbdm	Buduma	bdm	10.17\r\nbe	Belarusian	bel	1809.43\r\nbeb	Bebele	beb	7.52\r\nbew	Betawi	bew	11.15\r\nbfd	Bafut	bfd	9.03\r\nbft	Balti	bft	16.28\r\nbg	Bulgarian	bul	2190.76\r\nbgp	Eastern Balochi	bgp	10.98\r\nbhb	Bhili	bhb	9.98\r\nbhh	Bukharic	bhh	11.38\r\nbho	Bhojpuri	bho	10.05\r\nbhp	Bima	bhp	10.67\r\nbhr	Bara Malagasy	bhr	12.14\r\nbjj	Kanauji	bjj	11.01\r\nbjk	Barok	bjk	10.16\r\nbjn	Banjar	bjn	11.68\r\nbjt	Balanta-Ganja	bjt	9.41\r\nbkh	Bakoko	bkh	6.0\r\nbkm	Kom (Cameroon)	bkm	10.76\r\nbky	Bokyi	bky	9.85\r\nbmm	Northern Betsimisaraka Malagasy	bmm	19.12\r\nbmq	Bomu	bmq	10.68\r\nbn	Bengali	ben	271.76\r\nbnm	Batanga	bnm	15.01\r\nbnn	Bunun	bnn	9.26\r\nbns	Bundeli	bns	10.88\r\nbo	Tibetan	bod	82.27\r\nbou	Bondei	bou	9.98\r\nbqg	Bago-Kusuntu	bqg	8.86\r\nbr	Breton	bre	25.48\r\nbra	Braj	bra	10.68\r\nbrh	Brahui	brh	19.89\r\nbri	Mokpwe	bri	7.53\r\nbrx	Bodo	brx	231.57\r\nbs	Bosnian	bos	690.73\r\nbsh	Kati	bsh	8.77\r\nbsj	Bangwinji	bsj	10.0\r\nbsk	Burushaski	bsk	9.14\r\nbtm	Batak Mandailing	btm	11.09\r\nbtv	Bateri	btv	9.8\r\nbug	Buginese	bug	11.09\r\nbum	Bulu (Cameroon)	bum	9.06\r\nbuo	Terei	buo	9.48\r\nbux	Boghom	bux	10.48\r\nbwr	Bura-Pabir	bwr	10.4\r\nbxf	Bilur	bxf	10.84\r\nbyc	Ubaghara	byc	11.11\r\nbys	Burak	bys	9.92\r\nbyv	Medumba	byv	10.95\r\nbyx	Qaqet	byx	9.79\r\nbzc	Southern Betsimisaraka Malagasy	bzc	17.45\r\nbzw	Basa (Nigeria)	bzw	10.27\r\nca	Catalan	cat	3358.6\r\nccg	Samba Daka	ccg	10.11\r\nceb	Cebuano	ceb	12.17\r\ncen	Cen	cen	9.85\r\ncfa	Dijim-Bwilim	cfa	10.32\r\ncgg	Chiga	cgg	10.84\r\nchq	Quiotepec Chinantec	chq	9.76\r\ncjk	Chokwe	cjk	11.01\r\nckb	Central Kurdish	ckb	137.52\r\nckl	Cibak	ckl	10.91\r\nckr	Kairak	ckr	10.51\r\ncky	Cakfem-Mushere	cky	8.96\r\ncnh	Hakha Chin	cnh	2.24\r\ncpy	South Ucayali Ashéninka	cpy	9.15\r\ncs	Czech	ces	148.13\r\ncte	Tepinapa Chinantec	cte	9.54\r\nctl	Tlacoatzintepec Chinantec	ctl	10.04\r\ncut	Teutila Cuicatec	cut	8.04\r\ncux	Tepeuxila Cuicatec	cux	7.83\r\ncv	Chuvash	chv	23.96\r\ncy	Welsh	cym	131.21\r\nda	Danish	dan	1665.98\r\ndag	Dagbani	dag	10.14\r\ndar	Dargwa	dar	1.22\r\ndav	Taita	dav	9.12\r\ndbd	Dadiya	dbd	9.61\r\ndcc	Deccan	dcc	10.38\r\nde	German	deu	21927.13\r\ndeg	Degema	deg	11.07\r\ndgh	Dghwede	dgh	9.95\r\ndgo	Dogri	dgo	117.04\r\ndje	Zarma	dje	10.72\r\ndmk	Domaaki	dmk	6.38\r\ndml	Dameli	dml	9.18\r\ndru	Rukai	dru	9.26\r\ndty	Dotyali	dty	10.85\r\ndua	Duala	dua	12.13\r\ndv	Dhivehi	div	38.61\r\ndyu	Dyula	dyu	0.34\r\ndzg	Dazaga	dzg	9.96\r\nebr	Ebrié	ebr	1.5\r\nebu	Embu	ebu	9.81\r\nego	Eggon	ego	9.95\r\neiv	Askopan	eiv	10.44\r\neko	Koti	eko	8.15\r\nekr	Yace	ekr	10.76\r\nel	Greek	ell	2412.54\r\nelm	Eleme	elm	11.27\r\nen	English	eng	206061.1\r\neo	Esperanto	epo	1396.64\r\nes	Spanish	spa	27559.74\r\nesu	Central Yupik	esu	2.18\r\net	Estonian	est	960.37\r\neto	Eton (Cameroon)	eto	7.43\r\nets	Yekhee	ets	10.11\r\netu	Ejagham	etu	10.3\r\neu	Basque	eus	479.86\r\newo	Ewondo	ewo	12.71\r\next	Extremaduran	ext	13.59\r\neyo	Keiyo	eyo	9.24\r\nfa	Persian	fas	366.07\r\nfan	Fang (Equatorial Guinea)	fan	3.51\r\nfat	Fanti	fat	11.38\r\nff	Fulah	ful	13.84\r\nffm	Maasina Fulfulde	ffm	10.46\r\nfi	Finnish	fin	468.62\r\nfia	Nobiin	fia	9.96\r\nfil	Filipino	fil	7.71\r\nfip	Fipa	fip	10.55\r\nfkk	Kirya-Konzəl	fkk	9.98\r\nfmp	Fe'fe'	fmp	9.86\r\nfr	French	fra	23675.32\r\nfub	Adamawa Fulfulde	fub	13.12\r\nfuc	Pulaar	fuc	14.77\r\nfue	Borgu Fulfulde	fue	20.1\r\nfuf	Pular	fuf	13.77\r\nfuh	Western Niger Fulfulde	fuh	9.69\r\nfui	Bagirmi Fulfulde	fui	15.04\r\nfuq	Central-Eastern Niger Fulfulde	fuq	9.28\r\nfuv	Nigerian Fulfulde	fuv	9.97\r\nfy	Western Frisian	fry	70.41\r\nga	Irish	gle	21.4\r\ngbm	Garhwali	gbm	19.14\r\ngbr	Gbagyi	gbr	12.12\r\ngby	Gbari	gby	12.59\r\ngcc	Mali	gcc	9.87\r\ngdf	Guduf-Gava	gdf	12.21\r\ngej	Gen	gej	5.39\r\nges	Geser-Gorom	ges	10.08\r\nggg	Gurgula	ggg	7.12\r\ngid	Gidar	gid	10.06\r\ngig	Goaria	gig	9.41\r\ngiz	South Giziga	giz	10.03\r\ngjk	Kachi Koli	gjk	20.83\r\ngju	Gujari	gju	8.66\r\ngl	Galician	glg	208.81\r\nglw	Glavda	glw	10.51\r\ngn	Guarani	grn	4.06\r\ngol	Gola	gol	9.26\r\ngom	Goan Konkani	gom	9.82\r\ngsl	Gusilay	gsl	10.0\r\ngu	Gujarati	guj	91.18\r\ngui	Eastern Bolivian Guaraní	gui	22.72\r\ngur	Farefare	gur	9.24\r\nguz	Gusii	guz	9.5\r\ngv	Manx	glv	10.07\r\ngwc	Gawri	gwc	10.83\r\ngwe	Gweno	gwe	8.87\r\ngwt	Gawar-Bati	gwt	12.16\r\ngya	Northwest Gbaya	gya	8.45\r\ngyz	Geji	gyz	10.49\r\nha	Hausa	hau	17.75\r\nhah	Hahon	hah	9.64\r\nhao	Hakö	hao	8.56\r\nhaw	Hawaiian	haw	11.79\r\nhaz	Hazaragi	haz	9.69\r\nhbb	Huba	hbb	10.7\r\nhe	Hebrew	heb	13.4\r\nhem	Hemba	hem	9.53\r\nhi	Hindi	hin	117.17\r\nhia	Lamang	hia	11.07\r\nhkk	Hunjara-Kaina Ke	hkk	8.69\r\nhla	Halia	hla	9.86\r\nhno	Northern Hindko	hno	20.04\r\nhoj	Hadothi	hoj	10.08\r\nhr	Croatian	hrv	2795.31\r\nhsb	Upper Sorbian	hsb	2.71\r\nht	Haitian	hat	0.04\r\nhu	Hungarian	hun	255.83\r\nhue	San Francisco Del Mar Huave	hue	9.45\r\nhul	Hula	hul	10.33\r\nhux	Nüpode Huitoto	hux	9.04\r\nhwo	Hwana	hwo	11.23\r\nhy	Armenian	hye	42.15\r\nhz	Herero	her	9.59\r\nia	Interlingua (International Auxiliary Language Association)	ina	13.48\r\nibb	Ibibio	ibb	7.38\r\nid	Indonesian	ind	6327.87\r\nida	Idakho-Isukha-Tiriki	ida	9.31\r\nidu	Idoma	idu	11.16\r\nig	Igbo	ibo	13.69\r\nijc	Izon	ijc	9.95\r\nijn	Kalabari	ijn	11.04\r\nik	Inupiaq	ipk	2.11\r\nikw	Ikwere	ikw	10.0\r\nis	Icelandic	isl	647.29\r\nish	Esan	ish	10.05\r\niso	Isoko	iso	10.33\r\nit	Italian	ita	9402.46\r\nits	Isekiri	its	11.85\r\nitw	Ito	itw	9.19\r\nitz	Itzá	itz	7.08\r\nja	Japanese	jpn	36914.4\r\njal	Yalahatan	jal	11.18\r\njax	Jambi Malay	jax	10.29\r\njgo	Ngomba	jgo	10.15\r\njmx	Western Juxtlahuaca Mixtec	jmx	10.01\r\njns	Jaunsari	jns	11.25\r\njqr	Jaqaru	jqr	9.32\r\njuk	Wapan	juk	10.22\r\njuo	Jiba	juo	10.43\r\njv	Javanese	jav	11.19\r\nka	Georgian	kat	156.96\r\nkab	Kabyle	kab	529.52\r\nkai	Karekare	kai	10.52\r\nkaj	Jju	kaj	10.16\r\nkam	Kamba	kam	14.72\r\nkbd	Kabardian	kbd	108.35\r\nkbl	Kanembu	kbl	10.19\r\nkbt	Abadi	kbt	9.73\r\nkcq	Kamo	kcq	10.49\r\nkdh	Tem	kdh	4.07\r\nkea	Kabuverdianu	kea	10.51\r\nkeu	Akebu	keu	9.1\r\nkfe	Kota (India)	kfe	10.25\r\nkfk	Kinnauri	kfk	10.32\r\nkfp	Korwa	kfp	11.87\r\nkhg	Khams Tibetan	khg	6.38\r\nkhw	Khowar	khw	15.55\r\nkj	Kuanyama	kua	9.88\r\nkjc	Coastal Konjo	kjc	10.18\r\nkjk	Highland Konjo	kjk	10.21\r\nkk	Kazakh	kaz	1537.29\r\nkln	Kalenjin	kln	40.42\r\nkls	Kalasha	kls	9.11\r\nkm	Khmer	khm	7.1\r\nkmr	Northern Kurdish	kmr	69.59\r\nkmy	Koma	kmy	10.28\r\nkn	Kannada	kan	128.06\r\nkna	Dera (Nigeria)	kna	11.91\r\nknn	Konkani	knn	112.83\r\nko	Korean	kor	8609.28\r\nkol	Kol (Papua New Guinea)	kol	9.95\r\nkoo	Konzo	koo	13.23\r\nkpo	Ikposo	kpo	7.83\r\nkqo	Eastern Krahn	kqo	9.28\r\nks	Kashmiri	kas	110.42\r\nksd	Kuanua	ksd	9.91\r\nksf	Bafia	ksf	16.43\r\nkto	Kuot	kto	9.77\r\nkuh	Kushi	kuh	10.35\r\nkvx	Parkari Koli	kvx	11.04\r\nkw	Cornish	cor	12.15\r\nkwm	Kwambi	kwm	9.9\r\nkxp	Wadiyara Koli	kxp	20.0\r\nky	Kirghiz	kir	46.63\r\nkyx	Rapoisi	kyx	9.17\r\nlag	Rangi	lag	9.47\r\nlb	Luxembourgish	ltz	8.46\r\nlcm	Tungag	lcm	9.77\r\nldb	Dũya	ldb	11.31\r\nlg	Ganda	lug	447.82\r\nlij	Ligurian	lij	15.97\r\nlir	Liberian English	lir	10.26\r\nlkb	Kabras	lkb	9.99\r\nlla	Lala-Roba	lla	10.38\r\nln	Lingala	lin	17.99\r\nlnu	Longuda	lnu	10.46\r\nlo	Lao	lao	7.63\r\nloa	Loloda	loa	9.31\r\nlrk	Loarki	lrk	10.5\r\nlss	Lasi	lss	6.53\r\nlt	Lithuanian	lit	2629.45\r\nltg	Latgalian	ltg	27.23\r\nlto	Tsotso	lto	9.77\r\nlua	Luba-Lulua	lua	8.47\r\nluo	Luo	luo	36.17\r\nlus	Lushai	lus	20.24\r\nlv	Latvian	lav	1441.58\r\nlwg	Wanga	lwg	9.36\r\nmab	Yutanduchi Mixtec	mab	9.26\r\nmaf	Mafa	maf	9.97\r\nmai	Maithili	mai	131.37\r\nmau	Huautla Mazatec	mau	6.39\r\nmax	North Moluccan Malay	max	9.43\r\nmbo	Mbo (Cameroon)	mbo	9.51\r\nmcf	Matsés	mcf	9.61\r\nmcn	Masana	mcn	10.09\r\nmcx	Mpiemo	mcx	9.88\r\nmdd	Mbum	mdd	9.82\r\nmde	Maba (Chad)	mde	9.5\r\nmdf	Moksha	mdf	0.47\r\nmek	Mekeo	mek	9.18\r\nmer	Meru	mer	9.89\r\nmeu	Motu	meu	9.88\r\nmfm	Marghi South	mfm	10.05\r\nmfn	Cross River Mbembe	mfn	10.03\r\nmfo	Mbe	mfo	10.24\r\nmfv	Mandjak	mfv	9.55\r\nmgg	Mpumpong	mgg	4.94\r\nmgi	Lijili	mgi	10.89\r\nmhk	Mungaka	mhk	7.53\r\nmhr	Eastern Mari	mhr	272.31\r\nmi	Maori	mri	18.02\r\nmig	San Miguel El Grande Mixtec	mig	9.66\r\nmiu	Cacaloxtepec Mixtec	miu	9.18\r\nmk	Macedonian	mkd	27.21\r\nmkf	Miya	mkf	10.16\r\nmki	Dhatki	mki	8.83\r\nml	Malayalam	mal	166.57\r\nmlq	Western Maninkakan	mlq	9.83\r\nmn	Mongolian	mon	269.08\r\nmne	Naba	mne	10.37\r\nmni	Manipuri	mni	44.46\r\nmqy	Manggarai	mqy	10.5\r\nmr	Marathi	mar	156.71\r\nmrj	Western Mari	mrj	32.26\r\nmrr	Maria (India)	mrr	11.0\r\nmrt	Marghi Central	mrt	10.36\r\nms	Malay	msa	9.57\r\nmse	Musey	mse	7.21\r\nmsh	Masikoro Malagasy	msh	14.16\r\nmsw	Mansoanka	msw	9.32\r\nmt	Maltese	mlt	630.29\r\nmtr	Mewari	mtr	10.58\r\nmtu	Tututepec Mixtec	mtu	10.13\r\nmtx	Tidaá Mixtec	mtx	9.09\r\nmua	Mundang	mua	9.2\r\nmug	Musgu	mug	4.74\r\nmui	Musi	mui	10.52\r\nmve	Marwari (Pakistan)	mve	9.96\r\nmvy	Indus Kohistani	mvy	21.64\r\nmxs	Huitepec Mixtec	mxs	9.64\r\nmxu	Mada (Cameroon)	mxu	12.0\r\nmxy	Southeastern Nochixtlán Mixtec	mxy	9.48\r\nmy	Burmese	mya	12.14\r\nmyv	Erzya	myv	3.1\r\nmzl	Mazatlán Mixe	mzl	10.05\r\nnal	Nalik	nal	10.33\r\nnan	Min Nan Chinese	nan	17.55\r\nnap	Neapolitan	nap	9.97\r\nnb	Norwegian Bokmål	nob	12.7\r\nnbh	Ngamo	nbh	10.04\r\nncf	Notsi	ncf	9.84\r\nnco	Sibe	nco	9.96\r\nncx	Central Puebla Nahuatl	ncx	9.86\r\nndi	Samba Leko	ndi	11.27\r\nng	Ndonga	ndo	9.08\r\nngi	Ngizim	ngi	10.06\r\nnhg	Tetelcingo Nahuatl	nhg	8.92\r\nnhi	Zacatlán-Ahuacatlán-Tepetzintla Nahuatl	nhi	0.05\r\nnhn	Central Nahuatl	nhn	9.51\r\nnhq	Huaxcaleca Nahuatl	nhq	5.07\r\nnja	Nzanyi	nja	10.02\r\nnl	Dutch	nld	2264.13\r\nnla	Ngombale	nla	8.79\r\nnlv	Orizaba Nahuatl	nlv	11.42\r\nnmg	Kwasio	nmg	10.39\r\nnmz	Nawdm	nmz	6.3\r\nnn	Norwegian Nynorsk	nno	1.54\r\nnnh	Ngiemboon	nnh	16.15\r\nno	Norwegian	nor	3849.8\r\nnoe	Nimadi	noe	11.12\r\nnpi	Nepali	npi	171.5\r\nnso	Pedi	nso	12.64\r\nny	Chichewa	nya	10.8\r\nnyu	Nyungwe	nyu	8.98\r\noc	Occitan	oci	16.8\r\nodk	Od	odk	20.26\r\nodu	Odual	odu	10.57\r\nogo	Khana	ogo	10.51\r\nom	Oromo	orm	6.6\r\norc	Orma	orc	22.01\r\noru	Ormuri	oru	16.74\r\nory	Odia	ory	144.81\r\nos	Iron Ossetic	oss	1.38\r\npa	Panjabi	pan	147.37\r\npbs	Central Pame	pbs	9.69\r\npbt	Southern Pashto	pbt	11.6\r\npbu	Northern Pashto	pbu	11.03\r\npcm	Nigerian Pidgin	pcm	11.04\r\npex	Petats	pex	10.2\r\nphl	Phalura	phl	20.69\r\nphr	Pahari-Potwari	phr	24.03\r\npip	Pero	pip	9.85\r\npiy	Piya-Kwonci	piy	10.38\r\npko	Pökoot	pko	10.4\r\npl	Polish	pol	911.68\r\nplk	Kohistani Shina	plk	12.75\r\nplt	Plateau Malagasy	plt	19.39\r\npmq	Northern Pame	pmq	10.24\r\npms	Piemontese	pms	16.01\r\npmy	Papuan Malay	pmy	10.17\r\npnb	Western Panjabi	pnb	10.0\r\npoc	Poqomam	poc	9.63\r\npoe	San Juan Atzingo Popoloca	poe	10.01\r\npow	San Felipe Otlaltepec Popoloca	pow	8.84\r\nprq	Ashéninka Perené	prq	7.16\r\nps	Pushto	pus	88.62\r\npst	Central Pashto	pst	11.4\r\npt	Portuguese	por	16855.05\r\npua	Western Highland Purepecha	pua	10.17\r\npwn	Paiwan	pwn	13.76\r\nqug	Chimborazo Highland Quichua	qug	10.12\r\nqum	Sipacapense	qum	9.37\r\nqup	Southern Pastaza Quechua	qup	11.13\r\nqur	Yanahuanca Pasco Quechua	qur	9.95\r\nqus	Santiago del Estero Quichua	qus	9.55\r\nquv	Sacapulteco	quv	8.9\r\nqux	Yauyos Quechua	qux	9.35\r\nquy	Ayacucho Quechua	quy	0.05\r\nqva	Ambo-Pasco Quechua	qva	9.59\r\nqvi	Imbabura Highland Quichua	qvi	11.0\r\nqvj	Loja Highland Quichua	qvj	10.59\r\nqvl	Cajatambo North Lima Quechua	qvl	9.95\r\nqwa	Corongo Ancash Quechua	qwa	9.72\r\nqws	Sihuas Ancash Quechua	qws	10.18\r\nqxa	Chiquián Ancash Quechua	qxa	9.99\r\nqxp	Puno Quechua	qxp	9.81\r\nqxt	Santa Ana de Tusi Pasco Quechua	qxt	10.05\r\nqxu	Arequipa-La Unión Quechua	qxu	10.12\r\nqxw	Jauja Wanca Quechua	qxw	11.42\r\nrag	Logooli	rag	9.39\r\nrm	Romansh	roh	9.21\r\nro	Romanian	ron	70.23\r\nrob	Tae'	rob	9.02\r\nrof	Rombo	rof	18.9\r\nroo	Rotokas	roo	9.07\r\nrth	Ratahan	rth	9.34\r\nru	Russian	rus	20338.5\r\nrup	Macedo-Romanian	rup	0.02\r\nrw	Kinyarwanda	kin	2021.66\r\nsa	Sanskrit	san	84.44\r\nsah	Yakut	sah	16.08\r\nsat	Santali	sat	98.37\r\nsau	Saleman	sau	10.53\r\nsay	Saya	say	10.02\r\nsbn	Sindhi Bhil	sbn	10.53\r\nsc	Sardinian	srd	2.77\r\nscl	Shina	scl	9.84\r\nscn	Sicilian	scn	13.35\r\nsd	Sindhi	snd	46.27\r\nsei	Seri	sei	9.81\r\nshu	Chadian Arabic	shu	2.29\r\nsi	Sinhala	sin	11.98\r\nsip	Sikkimese	sip	10.07\r\nsiw	Siwai	siw	10.47\r\nsjr	Siar-Lak	sjr	9.87\r\nsk	Slovak	slk	2478.46\r\nskg	Sakalava Malagasy	skg	9.02\r\nskr	Saraiki	skr	4.13\r\nsl	Slovenian	slv	1172.61\r\nsn	Shona	sna	9.96\r\nsnc	Sinaugoro	snc	10.38\r\nsnk	Soninke	snk	10.04\r\nso	Somali	som	13.22\r\nsol	Solos	sol	9.95\r\nsps	Saposa	sps	9.81\r\nsq	Albanian	sqi	8.59\r\nsr	Serbian	srp	1855.33\r\nsrc	Logudorese Sardinian	src	10.67\r\nsro	Campidanese Sardinian	sro	10.16\r\nssi	Sansi	ssi	10.47\r\nste	Liana-Seti	ste	10.43\r\nsua	Sulka	sua	10.12\r\nsv	Swedish	swe	2453.14\r\nsva	Svan	sva	15.11\r\nsw	Swahili	swa	418.41\r\nszy	Sakizaya	szy	11.47\r\nta	Tamil	tam	423.09\r\ntan	Tangale	tan	10.14\r\ntar	Central Tarahumara	tar	9.73\r\ntay	Atayal	tay	7.02\r\ntbf	Mandara	tbf	10.01\r\ntcf	Malinaltepec Me'phaa	tcf	9.04\r\ntcy	Tulu	tcy	11.72\r\ntdn	Tondano	tdn	9.14\r\ntdx	Tandroy-Mahafaly Malagasy	tdx	3.81\r\nte	Telugu	tel	230.21\r\ntg	Tajik	tgk	9.23\r\ntgc	Tigak	tgc	9.71\r\nth	Thai	tha	10499.77\r\nthe	Chitwania Tharu	the	10.06\r\nthq	Kochila Tharu	thq	10.28\r\nthr	Rana Tharu	thr	9.99\r\nthv	Tahaggart Tamahaq	thv	4.25\r\nti	Tigrinya	tir	0.08\r\ntig	Tigre	tig	7.49\r\ntio	Teop	tio	9.85\r\ntk	Turkmen	tuk	2.86\r\ntkg	Tesaka Malagasy	tkg	17.86\r\ntkt	Kathoriya Tharu	tkt	10.64\r\ntli	Tlingit	tli	0.41\r\ntlp	Filomena Mata-Coahuitlán Totonac	tlp	11.35\r\ntn	Tswana	tsn	4.24\r\ntok	Toki Pona	tok	13.51\r\ntpl	Tlacoapa Me'phaa	tpl	9.28\r\ntpz	Tinputz	tpz	9.33\r\ntqp	Tomoip	tqp	10.1\r\ntr	Turkish	tur	125.36\r\ntrp	Kok Borok	trp	10.74\r\ntrq	San Martín Itunyoso Triqui	trq	8.29\r\ntrv	Sediq	trv	7.77\r\ntrw	Torwali	trw	14.98\r\ntt	Tatar	tat	30.03\r\nttj	Tooro	ttj	10.31\r\nttr	Tera	ttr	9.89\r\nttu	Torau	ttu	9.87\r\ntui	Tupuri	tui	9.26\r\ntul	Tula	tul	9.79\r\ntuq	Tedaga	tuq	10.0\r\ntuv	Turkana	tuv	10.17\r\ntuy	Tugen	tuy	8.79\r\ntvo	Tidore	tvo	10.31\r\ntvu	Tunen	tvu	9.85\r\ntw	Twi	twi	0.25\r\ntwu	Termanu	twu	11.45\r\ntxs	Tonsea	txs	9.32\r\ntxy	Tanosy Malagasy	txy	12.07\r\nudl	Wuzlam	udl	9.23\r\nug	Uighur	uig	428.77\r\nuk	Ukrainian	ukr	1851.97\r\nuki	Kui (India)	uki	10.77\r\numb	Umbundu	umb	10.59\r\nur	Urdu	urd	211.27\r\nush	Ushojo	ush	6.36\r\nuz	Uzbek	uzb	115.28\r\nuzn	Northern Uzbek	uzn	15.23\r\nvai	Vai	vai	8.76\r\nvar	Huarijio	var	9.28\r\nver	Mom Jango	ver	10.93\r\nvi	Vietnamese	vie	8481.98\r\nvmc	Juxtlahuaca Mixtec	vmc	9.43\r\nvmj	Ixtayutla Mixtec	vmj	10.17\r\nvmm	Mitlatongo Mixtec	vmm	9.95\r\nvmp	Soyaltepec Mazatec	vmp	10.17\r\nvmz	Mazatlán Mazatec	vmz	9.82\r\nvot	Votic	vot	0.1\r\nvro	Võro	vro	15.66\r\nwbl	Wakhi	wbl	11.67\r\nwci	Waci Gbe	wci	8.02\r\nweo	Wemale	weo	9.09\r\nwes	Cameroon Pidgin	wes	10.06\r\nwja	Waja	wja	10.22\r\nwji	Warji	wji	11.39\r\nwo	Wolof	wol	8.71\r\nwof	Gambian Wolof	wof	9.46\r\nxh	Xhosa	xho	13.35\r\nxhe	Khetrani	xhe	9.4\r\nxka	Kalkoti	xka	8.0\r\nxmf	Mingrelian	xmf	11.47\r\nxmv	Antankarana Malagasy	xmv	17.9\r\nxmw	Tsimihety Malagasy	xmw	11.53\r\nxpe	Liberia Kpelle	xpe	9.5\r\nxti	Sinicahua Mixtec	xti	9.5\r\nxtu	Cuyamecalco Mixtec	xtu	9.4\r\nyaq	Yaqui	yaq	9.93\r\nyav	Yangben	yav	8.7\r\nyay	Agwagwune	yay	8.26\r\nydd	Eastern Yiddish	ydd	18.43\r\nydg	Yidgha	ydg	9.89\r\nyer	Tarok	yer	10.08\r\nyes	Nyankpa	yes	10.26\r\nyi	Yiddish	yid	1.81\r\nyo	Yoruba	yor	15.66\r\nyue	Cantonese	yue	13302.38\r\nzga	Kinga	zga	9.5\r\nzgh	Standard Moroccan Tamazight	zgh	1.19\r\nzh	Chinese	cmn	111343.3\r\nzoc	Copainalá Zoque	zoc	10.07\r\nzoh	Chimalapa Zoque	zoh	9.35\r\nzor	Rayón Zoque	zor	9.04\r\nzpv	Chichicapan Zapotec	zpv	9.85\r\nzpy	Mazaltepec Zapotec	zpy	9.47\r\nztg	Xanaguía Zapotec	ztg	9.86\r\nztn	Santa Catarina Albarradas Zapotec	ztn	10.02\r\nztp	Loxicha Zapotec	ztp	9.62\r\nzts	Tilquiapan Zapotec	zts	9.33\r\nztu	Güilá Zapotec	ztu	9.17\r\nzu	Zulu	zul	14.83\r\nzza	Zaza	zza	1.52\r\n";
const OMNIVOICE_LANGUAGES = languageMapSource.trim().split(/\r?\n/).slice(1).map((line) => {
  const [code, name, iso6393] = line.split("	");
  return { code, name, iso6393 };
}).filter((language) => language.code && language.name);
const OMNIVOICE_LANGUAGE_COUNT = OMNIVOICE_LANGUAGES.length;
function searchOmniVoiceLanguages(query, limit = 60) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const popularCodes = ["vi", "en", "zh", "ja", "ko", "fr", "de", "es", "pt", "ru", "th", "id"];
  if (!normalizedQuery) {
    return popularCodes.map((code) => OMNIVOICE_LANGUAGES.find((language) => language.code === code)).filter((language) => Boolean(language));
  }
  return OMNIVOICE_LANGUAGES.filter((language) => language.code.toLocaleLowerCase().includes(normalizedQuery) || language.iso6393.toLocaleLowerCase().includes(normalizedQuery) || language.name.toLocaleLowerCase().includes(normalizedQuery)).slice(0, limit);
}
export {
  OMNIVOICE_LANGUAGE_COUNT as O,
  OMNIVOICE_LANGUAGES as a,
  searchOmniVoiceLanguages as s,
  useTtsStore as u
};
