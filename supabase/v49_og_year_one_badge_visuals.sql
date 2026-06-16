-- cried.bio v49: Refresh OG + Year One badge colors for milestone tier visuals

update public.badges
set color = '#b8962e'
where slug = 'og';

update public.badges
set color = '#c084fc'
where slug = 'year-one';
