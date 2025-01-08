////// Query examples クエリ例ポップアップ生成

//additional namespaces (not defined in namespaces.js) to use in examples as ns[] array which adds PREFIX clause
//クエリ例でns[]配列に指定することで追加のPREFIX句を加える
Snorqldef.example_ns = {
	"edm": "http://www.europeana.eu/schemas/edm/",
	"ore": "http://www.openarchives.org/ore/terms/",
	"wdt": "http://www.wikidata.org/prop/direct/",
	"crm": "http://www.cidoc-crm.org/cidoc-crm/",
	"pds": "http://purl.org/net/ns/policy#",
	"dct": "http://purl.org/dc/terms/",
	"dc": "http://purl.org/dc/elements/1.1/"
};

//list of example queries. each object represents one example: {label: Japanese label for select option, label_oth: English label for select option, ns: [prefixes to use in query], query: SPARQL query (escaped)}
//クエリ例を定義するオブジェクト
//mlabelは言語別ラベル。クエリフォームに説明コメントとしても表示する。複数の文（日本語なら「。」区切り）で構成されるラベルにすると、最初の区切り文字までを選択用ラベル、全体を説明コメントとして用いる
Snorqldef.example = [
	{
		"mlabel": ["クラス（型）別コンテンツ数。シンプルな集約の例です。jps:sourceInfoを加えることでアイテムに限定しています。", "Count items by type. A simple example of aggregation. jps:sourceInfo ensures the resulting ?cho are items (not agents, locations, etc)"],
		"query" : 
`SELECT ?type (count(?cho) as ?count) WHERE {
	?cho a ?type ;
		jps:sourceInfo ?source .
} GROUP BY ?type
`,
		"ns" : [ ]	//list of ns prefixes defined in example_ns, if necessary 必要に応じてexample_nsで定義した接頭辞リスト
	},
	{
		"mlabel": ["データセット別件数。データセット（提供者）はjps:sourceInfo/schema:providerで記述しています。", "Count items by Dataset (source). Data provider is described with jps:sourceInfo/schema:provider"],
		"query": 
`SELECT ?provider (count(?cho) as ?count) WHERE {
	?cho jps:sourceInfo/schema:provider ?provider .
}GROUP BY ?provider ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["ライセンス区分（商用利用等）別件数。各ライセンスはバージョン違いを統合したURIを商用利用可などのカテゴリに分類しています。", "Count items by license category. Each license has version independent URI which is categorised by AllowCommercial etc."],
		"query": 
`SELECT ?lcategory (count(?cho) as ?count) WHERE {
	?cho jps:accessInfo/schema:license ?license .
	?license dct:isVersionOf?/schema:category ?lcategory .
}GROUP BY ?lcategory
`,
		"ns": ["dct"]
	},
	{
		"mlabel": ["画像ありライセンス区分指定検索。商用利用可もしくは非商用のみで分類", "Search items w/ images by license category. AllowCommercial or NonCommercialOnly"],
		"query": 
`SELECT ?license (count(?cho) as ?count) ?lcategory WHERE {
	?cho schema:image ?image ;
	jps:accessInfo/schema:license ?license .
	?license dct:isVersionOf?/schema:category ?lcategory .
	FILTER(?lcategory = pds:AllowCommercial || ?lcategory = pds:NonCommercialOnly)
}GROUP BY ?lcategory ?license ORDER BY ?lcategory desc(?count)
`,
		"ns": ["dct", "pds"]
	},
	{
		"mlabel": ["歌麿の作品。OPTIONALでサムネイル画像なしのアイテムも対象に含めます。owl:sameAs?を加えることでNDLAなども対象に検索できます。", "Work items by Utamaro (喜多川歌麿). With OPTIONAL items without thumbnail will also be selected. With owl:sameAs?, other ids e.g. NDLA will also be searched"],
		"query": 
`SELECT ?cho ?label ?thumbnail WHERE {
	?cho rdfs:label ?label;
		schema:creator/owl:sameAs? chname:喜多川歌麿 .
	OPTIONAL {?cho schema:image ?thumbnail}
}
`
	},
	{
		"mlabel": ["「面」を検索。データセットにより、type:面が付与されたものとカテゴリが仮面のものがあるため、両方検索してUNIONで結合します。", "Find Masks. Some dataset assing type while others assing category. UNION combines both results"],
		"query": 
`SELECT ?cho ?label ?image WHERE {
	?cho rdfs:label ?label .
	OPTIONAL {?cho schema:image ?image}
	{?cho a type:面 } UNION {?cho schema:category keyword:仮面}
}
`
	},
	{
		"mlabel": ["三十六歌仙の勅撰歌（作者別）。作者が三十六歌仙に含まれることをschema:memberOfで示します。", "Waka by 36 Immortals of Poetry. schema:memberOf tells the author is a member of 36 Immortals"],
		"query": 
`SELECT ?who (count(?cho) as ?count) WHERE {
	?cho jps:sourceInfo/schema:provider chname:二十一代集データベース ;
		schema:creator ?who .
	?who schema:memberOf chname:三十六歌仙 .
} GROUP BY ?who ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["ARC錦絵の役者トップ200件。浮世絵作者と区別するためrole:内容.配役を用います。", "Top 200 actors in ARC Ukiyoe. With role:内容.配役, actors are distinguished from Ukiyoe creators"],
		"query": 
`SELECT ?who (count(?cho) as ?count) WHERE {
	?cho jps:sourceInfo/schema:provider chname:ARC浮世絵ポータル ;
		jps:agential [
			jps:relationType role:内容.配役 ;
			jps:value ?who ]
} GROUP BY ?who ORDER BY desc(?count) LIMIT 200
`
	},
	{
		"mlabel": ["名所図会の辞書分類別。図会に記された名所を辞書登録しschema:genreを付与しています。", "Meisho-zue by dict genre. Each place is registered as chname: and assigned schema:genre"],
		"query": 
`SELECT ?what (count(?cho) as ?count) WHERE {
	?cho jps:sourceInfo/schema:provider chname:平安京都名所図会 ;
		schema:about/schema:genre ?what
} GROUP BY ?what ORDER BY desc(?count) LIMIT 200
`
	},
	{
		"mlabel": ["'みちしる'と位置情報。'みちしる'の緯度経度と画像を検索。地図表示も可能です。カテゴリは他に「たずねる」「自然」「伝統文化」「鉄道」「食」など。", "Michi-shiru geo info. Query lat, long and image, which can be marked on a map."],
		"query": 
`SELECT ?cho ?label ?lat ?long ?image WHERE {
	?cho rdfs:label ?label ;
		jps:sourceInfo/schema:provider chname:みちしる ;
		schema:category keyword:地域 ;
		jps:spatial/schema:geo [schema:latitude ?lat ; schema:longitude ?long ]	;
		schema:image ?image
}
`
	},
	{
		"mlabel": ["名所図会の記述内容の位置情報。図会に記された名所の緯度経度を用いて地図表示できます。", "Meisho-zue geo info. Query lat and long of targets, which can be marked on a map."],
		"query": 
`SELECT ?cho ?label ?lat ?long WHERE {
	?cho rdfs:label ?label ;
		jps:sourceInfo/schema:provider chname:平安京都名所図会 ;
		schema:about/schema:location/schema:geo [
			schema:latitude ?lat ;
			schema:longitude ?long
		]
}
`
	},
	{
		"mlabel": ["写真原板データ地域別トップ200件。市郡レベルの地域をjps:spatial/jps:regionに記述しています。", "Top 200 regions in Photo database. City level location is recorded in ps:spatial/jps:region"],
		"query": 
`SELECT ?where (count(?cho) as ?count) WHERE {
	?cho jps:sourceInfo/schema:provider chname:写真原板データベース ;
		jps:spatial/jps:region ?where .
} GROUP BY ?where ORDER BY desc(?count) LIMIT 200
`
	},
	{
		"mlabel": ["自治体コード別トップ200件。市郡を辞書登録しschema:urlでSACを記述しています。", "Top 200 regions by SAC code. Each city entity has schema:url for the code"],
		"query": 
`SELECT ?sac (count(?cho) as ?count) (sample(?name) as ?name) WHERE {
	?cho jps:spatial/jps:region [
		schema:url ?sac ; rdfs:label ?name ].
} GROUP BY ?sac ORDER BY desc(?count) LIMIT 200
`},
	{
		"mlabel": ["メディア芸術DBとの統合クエリ（赤瀬川原平）。メディア芸術DBのIDをowl:sameAsとして辞書登録しています。", "Cross search (fed. query) Mediaart DB. Mediaart DB id is owl:sameAs chname:"],
		"query": 
`SELECT ?uri ?label WHERE {
	BIND(chname:赤瀬川原平 as ?who)
	{
		?mid owl:sameAs ?who ; rdfs:isDefinedBy <https://mediaarts-db.bunka.go.jp/id/>.
		SERVICE <https://mediag.bunka.go.jp/sparql> {
			?uri dct:creator ?mid ;
				rdfs:label ?label
		}
	}UNION{
		?uri schema:creator/owl:sameAs? ?who ;
			rdfs:label ?label
	}
}
`,
		"ns" : ["dct" ]
	},
	{
		"mlabel": ["Europeanaとの統合クエリ（歌川豊国）。Europeanaはdc:creatorの値としてリテラル値を持っています。", "Cross search (fed. query) Europeana. Europeana RDF has literal values for dc:creator"],
		"query": 
`SELECT ?uri ?label ?thumbnail WHERE {
	BIND(chname:歌川豊国 as ?cname)
	{
		?cname schema:name ?ename. FILTER(lang(?ename)="en")
		BIND(replace(?ename, ", ", " ") as ?name)
		SERVICE <http://sparql.europeana.eu/> {
			?uri dc:title ?label ; dc:creator ?name .
			OPTIONAL{?uri ore:proxyIn [edm:isShownBy ?thumbnail ]}
		}
	} UNION {
		?uri rdfs:label ?label;
			schema:creator/owl:sameAs? ?cname .
		OPTIONAL{?uri schema:image ?thumbnail}
	}
}
`,
		"ns" : ["dc", "edm", "ore" ]
	},
	{
		"mlabel": ["NDC-LDを用いた類目（第一次区分）別。各アイテムのNDCはNDC-LDの第三次区分にcloseMatch|broadMatchで関連付けています。", "Items by NDC-LD division. Each NDC is related to NDC-LD section with closeMatch|broadMatch"],
		"query": 
`SELECT ?what (count(?cho) as ?count) (sample(?clabel) as ?clabel) WHERE {
	?cho jps:sourceInfo ?source ;
		 schema:about/(skos:closeMatch|skos:broadMatch)/skos:broader+ ?what .
	?what a <http://jla.or.jp/vocab/ndcvocab#MainClass> ; rdfs:label ?clabel
} GROUP BY ?what ORDER BY ?what
`
	},
	{
		"mlabel": ["NDC第一次区分8類の図書。NDC-LDの第三次区分(Section)を調べ、その上位がndc9:8であるものを区分ごとに集約します。", "Books with NDC division 8. Selects NDC-LD section whose division (broader) is ndc9:8 and aggreate by sections"],
		"query": 
`SELECT ?ndc (count(?cho) as ?count) (sample(?clabel) as ?clabel) WHERE {
	?cho a type:図書 ;
		schema:about/(skos:closeMatch|skos:broadMatch) ?ndc .
	?ndc a <http://jla.or.jp/vocab/ndcvocab#Section> ;
		skos:broader+ <http://jla.or.jp/data/ndc9#8> ;
		rdfs:label ?clabel
} GROUP BY ?ndc ORDER BY ?ndc
`
	},
	{
		"mlabel": ["NDC類目が5～7のNDLデジタルコレクション。デジコレのNDC-LDの第三次区分(Section)を調べ、その値が500～799であるものを区分ごとに集約します。", "NDL Digital Collection w/ NDC division 5-7. Selects NDC-LD section whose value is in 500-799 and aggreate by sections"],
		"query": 
`SELECT ?what (count(?cho) as ?count) (sample(?name) as ?name) WHERE {
	?cho jps:sourceInfo/schema:provider chname:NDLデジタルコレクション ;
		schema:about/(skos:closeMatch|skos:broadMatch) ?what .
	?what a <http://jla.or.jp/vocab/ndcvocab#Section> ; skos:notation ?ndc
	FILTER(?ndc >= "500" && ?ndc <= "799")
	 ?what rdfs:label ?name
} GROUP BY ?what ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["ラテン文学（英語ラベルから）。NDC分類の標目（prefLabel）にLatin literatureを含むもの。", "Classification: Latin literature. Selects items whose NDC (or their broader term) prefLabel contains \"Latin literature\""],
		"query": 
`SELECT distinct ?cho ?label ?ndc WHERE {
	?cho schema:about ?ndc ;
		rdfs:label ?label.
	?ndc (skos:closeMatch|skos:broadMatch)/skos:broader*/skos:prefLabel "Latin literature"@en
}
`
	},
	{
		"mlabel": ["魚類写真データ分類目別。魚類分類体系を辞書登録しschema:aboutで関連付けています。「目」はOrderRank型を持ちます。", "Fish Pictures by classification (Order). Each picture is associated fish classification dictionary with schema:about"],
		"query": 
`SELECT ?rank (count(?cho) as ?count) WHERE {
	?cho jps:sourceInfo/schema:provider chname:魚類写真資料データベース ;
		schema:about/skos:broader+ ?rank .
	?rank a <https://jpsearch.go.jp/term/nctype/OrderRank> .
} GROUP BY ?rank ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["サムネイル画像の多い作者トップ100件。rdfs:isDefinedBy chname:は辞書登録された作者を示します。", "Top 100 creators of # thumbnail images. rdfs:isDefinedBy chname: limits only normalized dictionary entries"],
		"query": 
`SELECT ?who (count(?cho) as ?count) (sample(?image) as ?image) WHERE {
	?cho schema:creator ?who ;
		schema:image ?image .
	?who rdfs:isDefinedBy chname: .
} GROUP BY ?who ORDER BY desc(?count) LIMIT 100 
`
	},
	{
		"mlabel": ["LODACとの統合クエリ（安藤＝歌川広重）。LODACのRDFは作者を独自語彙、所蔵館をCIDOC-CRMで記述しています。", "Cross search (fed. query) LODAC. LODAC uses its own property for creator and CIDOC-CRM for provider"],
		"query": 
`SELECT distinct ?uri ?label ?who ?provider ?thumbnail WHERE {
	?jpswho a type:Agent ; schema:name "安藤広重"@ja .
	{
		?jpswho owl:sameAs ?lodacwho . ?lodacwho rdfs:isDefinedBy <http://lod.ac/id/>
		SERVICE <http://lod.ac/sparql> {
			?lodacwho rdfs:label ?who ; <http://lod.ac/ns/lodac#creates> ?uri .
			?uri rdfs:label ?label .
			OPTIONAL {?uri <http://purl.org/NET/cidoc-crm/core#P55_has_current_location> [rdfs:label ?provider] }
		}
	} UNION {
		?uri rdfs:label ?label;
			jps:agential [ schema:description ?who ; jps:value/owl:sameAs? ?jpswho ] ;
			jps:accessInfo/schema:provider/rdfs:label ?provider .
		OPTIONAL{?uri schema:image ?thumbnail}
	}
}
`
	},
	{
		"mlabel": ["スミソニアンSAAMとの統合クエリ（国吉康雄）。SAAMは全面的にをCIDOC-CRMを採用しています。", "Cross search (fed. query) SAMM. Smithonian uses CIDOC-CRM vocab."],
		"query": 
`SELECT distinct ?uri ?label ?thumbnail WHERE {
	?cname rdfs:label "国吉康雄" ; owl:sameAs ?saamid .
	FILTER(strstarts(str(?saamid), "http://edan.si.edu/"))
	{
		SERVICE <http://edan.si.edu/saam/sparql> {
			?production crm:P14_carried_out_by ?saamid ;
				crm:P108_has_produced ?uri .
			?uri crm:P102_has_title [rdfs:label ?label ] .
			OPTIONAL {?uri crm:P138i_has_representation ?thumbnail }
		}
	} UNION {
		?uri rdfs:label ?label;
			schema:creator/owl:sameAs? ?cname .
		OPTIONAL{?uri schema:image ?thumbnail}
	}
}
`,
		"ns" : ["crm", "owl" ]
	},
	{
		"mlabel": ["東大学術資産アーカイブズ（コレクション別）。東大学術資産のコレクションをschema:isPartOfで記述。資料階層と区別するためCollection型を用います。", "UTokyo Academic Archives Portal by collection. UTokyo AA's collection is described by schema:isPartOf and Collection class"],
		"query": 
`SELECT ?what (count(?cho) as ?count) (sample(?wlabel) as ?name) WHERE {
	?cho jps:sourceInfo/schema:provider chname:東京大学学術資産アーカイブズ  ;
		schema:isPartOf ?what .
	?what a schema:Collection ; rdfs:label ?wlabel .
} GROUP BY ?what ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["能・高砂の年別上演数。能の作品をwork:名前空間で辞書登録し、schema:workPerformedで関連付けています。", "# of perf. of Takasago Noh by year. Noh works are described with work: namespace, and linked with workPerformed"],
		"query": 
`SELECT ?when (count(?cho) as ?count) WHERE {
	?cho schema:workPerformed <https://jpsearch.go.jp/entity/work/高砂(能楽)> ;
		schema:temporal ?when .
} GROUP BY ?when ORDER BY ?when
`
	},
	{
		"mlabel": ["源氏物語きりつぼの各行。行はpartOfでページ毎にまとめ、ページはさらにisPartOfで章毎にまとめています（アイテムのページ記述が不要なら両方ともisPartOfで可）。", "Lines from Tale of Genji Chap.1 (Japanese). Each item (represents a line) is partOf a page, which is a partOf a chapter."],
		"query": 
`SELECT ?cho ?label ?position WHERE {
	?cho jps:sourceInfo/schema:provider chname:絵入源氏物語 ;
		rdfs:label ?label ;
		jps:partOf [
			jps:selector ?position ;
			jps:source/schema:isPartOf/rdfs:label "きりつぼ" ] .
} ORDER BY ?cho
`
	},
	{
		"mlabel": ["1810年代の絵画。時間実体は開始年(jps:start)と終了年(jps:end)を持つので、その値が1810～1820年の範囲になるよう絞り込みます。", "Paintings in 1810s. Time entity has jps:start and jps:end, whose values can be used to filter between 1810-1820"],
		"query": 
`SELECT DISTINCT ?cho ?label ?dt ?thumbnail WHERE {
	?cho a/rdfs:subClassOf* type:絵画 ; 
		rdfs:label ?label;
		schema:temporal [
			rdfs:label ?dt ;
			jps:start ?start; 
			jps:end ?end 
	]
	FILTER(?start >= 1810 && ?end < 1820)
	OPTIONAL {?cho schema:image ?thumbnail}
} ORDER BY ?start
`
	},
	{
		"mlabel": ["奈良時代のアイテムを型別列挙。時代実体は各年実体からisPartOfで関連付けているので、より簡単に絞り込み可能です。", "Paintings in 奈良時代 (Nara period). Each year entity is assigned Historical era entity by schema:isPartOf."],
		"query": 
		`SELECT ?type (count(?cho) as ?count) WHERE {
	?cho a ?type ;
		schema:temporal/schema:isPartOf time:奈良時代
} GROUP BY ?type ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["東大寺近辺のアイテム型別（geohash）。場所情報はschema:geoで緯度経度geohashを持ち、広範囲geohashとjps:withinで階層化記述しています。", "Items near Todaiji (東大寺) by type. Location entity has schema:geo for geohash, which is related to wider area with jps:within"],
		"query": 
`SELECT ?type (count(?cho) as ?count)  WHERE {
	?cho a ?type ;
		jps:spatial/schema:geo/jps:within+ <http://geohash.org/xn0t7>
} GROUP BY ?type
`
	},
	{
		"mlabel": ["作者Hokusaiの作品。英語名は人物実体のschema:nameで。bif:containsは部分一致を素早く探すVirtuoso拡張関数です。", "Work items by 'Hokusai'. English name is provided with schema:name. bif:contains is a Virtuoso extension for text search"],
		"query" : 
`SELECT ?cho ?label ?thumbnail WHERE {
	?cho rdfs:label ?label;
		schema:creator/owl:sameAs? [schema:name ?creator ].
	FILTER bif:contains(?creator, '"Hokusai"')
	OPTIONAL {?cho schema:image ?thumbnail}
}
`
	},
	{
		"mlabel": ["タイトルにkodomoを含む絵画。タイトル（ラベル）のローマ字表記をschema:nameに格納しています。", "Paintings with title including 'kodomo' (child). Roman transcription of each title (label) is stored in schema:name"],
		"query": 
`SELECT distinct ?cho ?label ?thumbnail WHERE {
	?cho a/rdfs:subClassOf* type:絵画 ;
		rdfs:label ?label;
		schema:name ?name.
	FILTER bif:contains(?name, '"kodomo*"')
	OPTIONAL {?cho schema:image ?thumbnail}
}
`
	},
	{
		"mlabel": ["言語（情報のあるもの）上位100件。アイテムの言語情報はISO639-2のURIで示し、schema:inLanguageで記述しています。", "Top 100 contents languages (if available). Item's language info is described with schema:inLanguage as ISO639-2 URI"],
		"query": 
`SELECT ?lang (count(?cho) as ?count) (sample(?name) as ?name) WHERE {
	?cho
		schema:inLanguage ?lang .
	?lang rdfs:label ?name
} GROUP BY ?lang ORDER BY desc(?count) LIMIT 100
`
	},
	{
		"mlabel": ["芸術・美術の提供者別件数。提供者（所蔵館）はjps:accessInfo/schema:providerで記述しています。", "Count art work items by access provider. Providers are described with jps:accessInfo/schema:provider"],
		"query": 
`SELECT ?provider (count(?cho) as ?count) WHERE {
	?cho a/rdfs:subClassOf* type:芸術・美術 ;
		jps:accessInfo/schema:provider ?provider .
}GROUP BY ?provider ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["東京国立博物館の彫刻。OPTIONALの場所、年代情報はrelationTypeによって制作に関するものに限定しています。。", "Sculptures in Tokyo National Museum. OPTIONAL time/location is limited to those of creation (role:制作) by relationType"],
		"query": 
`SELECT DISTINCT ?cho ?label ?where ?when WHERE {
	?cho a type:彫刻 ; rdfs:label ?label ;
		jps:accessInfo/schema:provider chname:東京国立博物館 .
	OPTIONAL {?cho jps:spatial [jps:relationType/skos:broader? role:制作 ; jps:value ?where ]}
	OPTIONAL {?cho jps:temporal [jps:relationType/skos:broader? role:制作 ; jps:value ?when ]}
}
`
	},
	{
		"mlabel": ["標本の採集地トップ100件。地域別集約の例です。a/rdfs:subClassOf?で標本およびそのサブクラスに属するアイテムを検索します。", "Top 100 places to collect specimen. A typical example of aggregation by location. a/rdfs:subClassOf? selects member of type:標本 (specimen) and its sub classes"],
		"query": 
`SELECT ?where (count(?cho) as ?count) WHERE {
	?cho a/rdfs:subClassOf? type:標本 ;
		schema:spatial ?where .
} GROUP BY ?where ORDER BY desc(?count) LIMIT 100
`
	},
	{
		"mlabel": ["北斎の元データ表記別。葛飾北斎に正規化した元データの記述は構造化ノードのschema:descriptionに保持しているので、これをキーに集約する例です（リテラル集約なのでリンクは示されませんが、Ctrl＋クリックで展開できます）。", "Hokusai as original description. Hokusai used varied names, which is retainde in schema:description of structured node."],
		"query": 
`SELECT ?key (count(?cho) as ?count) WHERE {
	?cho jps:agential [
		jps:value/owl:sameAs? chname:葛飾北斎 ;
		schema:description ?key
	]
} GROUP BY ?key ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["刀剣の作者トップ100件。作者別集約の例です。", "Top 100 creators of Swards. A simple example of aggregation by creator."],
		"query": 
`SELECT ?who (count(distinct ?cho) as ?count) ?name WHERE {
	?cho a type:刀剣 ;
		schema:creator ?who .
		?who rdfs:label ?name
} GROUP BY ?who ?name ORDER BY desc(?count) LIMIT 100
`
	},
	{
		"mlabel": ["版欧州所在日本古書目録の著者別。作者別集約のシンプルな例です。", "Authors in Early Japanese Books in Europe. A simple example of aggregation by creator."],
		"query": 
`SELECT ?who (count(?cho) as ?count) WHERE {
	?cho jps:sourceInfo/schema:provider chname:欧州所在日本古書総合目録 ;
		schema:creator ?who .
} GROUP BY ?who ORDER BY desc(?count)
`
	},
	{
		"mlabel": ["国宝タイプ別（暫定・別リスト使用）。アイテムの記述とは別に用意したテスト版の国宝対応リストによる集約です。", "Count national treasures by type (tentative). Based on experimental mapping list prepared independent of item description."],
		"query" : 
`SELECT ?type (count(?cho) as ?count) WHERE {
	?cho a ?type .
	?nt schema:genre <http://ja.dbpedia.org/resource/国宝> ;
		rdfs:seeAlso ?cho .
} GROUP BY ?type
`
	},
	{
		"mlabel": ["国宝・重文タイプ別（アイテムのカテゴリ使用）。アイテムの記述に基づいて付与したcategoryによる集約です。", "Count national treasures by type. Based on schema:category taken from item description."],
		"query" : 
`SELECT ?type (count(?cho) as ?count) WHERE {
	?cho a ?type .
	{?cho schema:category keyword:国宝} UNION 
	{?cho schema:category <https://jpsearch.go.jp/term/keyword/国宝・重要文化財(美術品)>}
} GROUP BY ?type
`
	}
];
