/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GraphNode, GraphEdge } from '../types';
import { PLACES } from './places';

// Every node in this system is a heritage site (no routing junctions),
// mirroring the Graph class in Smart_Tour_Planning_System.py
export const GRAPH_NODES: GraphNode[] = PLACES.map((p) => ({
  id: p.id,
  name: p.name,
  x: p.x,
  y: p.y,
  isPlace: true,
  placeId: p.id,
}));

// Road distances (km, converted to meters) between heritage sites,
// identical to road_edges in Smart_Tour_Planning_System.py
export const INITIAL_EDGES: GraphEdge[] = [
  {
    id: 'e_wat_bakheng',
    from: 'angkor_wat',
    to: 'phnom_bakheng',
    distance: 1300,
    roadName: 'Angkor Wat - Phnom Bakheng Road',
    isBlocked: false,
  },
  {
    id: 'e_wat_kravan',
    from: 'angkor_wat',
    to: 'kravan',
    distance: 5000,
    roadName: 'Angkor Wat - Kravan Road',
    isBlocked: false,
  },
  {
    id: 'e_bayon_terrace',
    from: 'bayon',
    to: 'terrace_of_the_elephants',
    distance: 1100,
    roadName: 'Bayon - Terrace of the Elephants Road',
    isBlocked: false,
  },
  {
    id: 'e_bayon_baphuon',
    from: 'bayon',
    to: 'baphuon',
    distance: 900,
    roadName: 'Bayon - Baphuon Road',
    isBlocked: false,
  },
  {
    id: 'e_thommanon_bayon',
    from: 'thommanon',
    to: 'bayon',
    distance: 2400,
    roadName: 'Thommanon - Bayon Road',
    isBlocked: false,
  },
  {
    id: 'e_bakheng_bayon',
    from: 'phnom_bakheng',
    to: 'bayon',
    distance: 2000,
    roadName: 'Phnom Bakheng - Bayon Road',
    isBlocked: false,
  },
  {
    id: 'e_baphuon_terrace',
    from: 'baphuon',
    to: 'terrace_of_the_elephants',
    distance: 190,
    roadName: 'Baphuon - Terrace of the Elephants Road',
    isBlocked: false,
  },
  {
    id: 'e_baphuon_teppranam',
    from: 'baphuon',
    to: 'tep_pranam',
    distance: 750,
    roadName: 'Baphuon - Tep Pranam Road',
    isBlocked: false,
  },
  {
    id: 'e_takeo_taprohm',
    from: 'ta_keo',
    to: 'ta_prohm',
    distance: 1400,
    roadName: 'Ta Keo - Ta Prohm Road',
    isBlocked: false,
  },
  {
    id: 'e_thommanon_takeo',
    from: 'thommanon',
    to: 'ta_keo',
    distance: 700,
    roadName: 'Thommanon - Ta Keo Road',
    isBlocked: false,
  },
  {
    id: 'e_tatuot_takeo',
    from: 'ta_tuot',
    to: 'ta_keo',
    distance: 2800,
    roadName: 'Ta Tuot - Ta Keo Road',
    isBlocked: false,
  },
  {
    id: 'e_terrace_leperking',
    from: 'terrace_of_the_elephants',
    to: 'terrace_of_the_leper_king',
    distance: 350,
    roadName: 'Terrace of the Elephants - Terrace of the Leper King Road',
    isBlocked: false,
  },
  {
    id: 'e_leperking_teppranam',
    from: 'terrace_of_the_leper_king',
    to: 'tep_pranam',
    distance: 1000,
    roadName: 'Terrace of the Leper King - Tep Pranam Road',
    isBlocked: false,
  },
  {
    id: 'e_teppranam_preahpithu',
    from: 'tep_pranam',
    to: 'preah_pithu_u',
    distance: 350,
    roadName: 'Tep Pranam - Preah Pithu U Road',
    isBlocked: false,
  },
  {
    id: 'e_preahpithu_tatuot',
    from: 'preah_pithu_u',
    to: 'ta_tuot',
    distance: 100,
    roadName: 'Preah Pithu U - Ta Tuot Road',
    isBlocked: false,
  },
  {
    id: 'e_terrace_thommanon',
    from: 'terrace_of_the_elephants',
    to: 'thommanon',
    distance: 2000,
    roadName: 'Terrace of the Elephants - Thommanon Road',
    isBlocked: false,
  },
  {
    id: 'e_taprohm_banteaykdei',
    from: 'ta_prohm',
    to: 'banteay_kdei',
    distance: 600,
    roadName: 'Ta Prohm - Banteay Kdei Road',
    isBlocked: false,
  },
  {
    id: 'e_banteaykdei_kravan',
    from: 'banteay_kdei',
    to: 'kravan',
    distance: 1500,
    roadName: 'Banteay Kdei - Kravan Road',
    isBlocked: false,
  },
];
