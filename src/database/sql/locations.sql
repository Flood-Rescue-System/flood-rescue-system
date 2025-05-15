-- Create Districts and Subdivisions Tables
create table if not exists districts (
  id serial primary key,
  name text not null unique
);

create table if not exists subdivisions (
  id serial primary key,
  name text not null,
  district_id integer references districts(id) not null,
  headquarters text,
  unique(name, district_id)
);

-- Insert Districts
insert into districts (name) values
  ('Alappuzha'),
  ('Ernakulam'),
  ('Idukki'),
  ('Kannur'),
  ('Kasaragod'),
  ('Kollam'),
  ('Kottayam'),
  ('Kozhikode'),
  ('Malappuram'),
  ('Palakkad'),
  ('Pathanamthitta'),
  ('Thiruvananthapuram'),
  ('Thrissur'),
  ('Wayanad');

-- Insert Subdivisions
insert into subdivisions (district_id, name, headquarters) values
  -- Alappuzha
  ((select id from districts where name = 'Alappuzha'), 'Ambalapuzha', 'Alappuzha'),
  ((select id from districts where name = 'Alappuzha'), 'Chengannur', 'Chengannur'),
  ((select id from districts where name = 'Alappuzha'), 'Cherthala', 'Cherthala'),
  ((select id from districts where name = 'Alappuzha'), 'Karthikappally', 'Haripad'),
  ((select id from districts where name = 'Alappuzha'), 'Kuttanad', 'Mankombu'),
  ((select id from districts where name = 'Alappuzha'), 'Mavelikkara', 'Mavelikkara'),

  -- Ernakulam
  ((select id from districts where name = 'Ernakulam'), 'Aluva', 'Aluva'),
  ((select id from districts where name = 'Ernakulam'), 'Kanayannur', 'Ernakulam'),
  ((select id from districts where name = 'Ernakulam'), 'Kochi', 'Fort Kochi'),
  ((select id from districts where name = 'Ernakulam'), 'Kothamangalam', 'Kothamangalam'),
  ((select id from districts where name = 'Ernakulam'), 'Kunnathunad', 'Perumbavoor'),
  ((select id from districts where name = 'Ernakulam'), 'Muvattupuzha', 'Muvattupuzha'),
  ((select id from districts where name = 'Ernakulam'), 'North Paravur', 'North Paravur'),

  -- Idukki
  ((select id from districts where name = 'Idukki'), 'Devikulam', 'Devikulam'),
  ((select id from districts where name = 'Idukki'), 'Peermade', 'Peermade'),
  ((select id from districts where name = 'Idukki'), 'Udumbanchola', 'Nedumkandam'),
  ((select id from districts where name = 'Idukki'), 'Idukki', 'Painavu'),
  ((select id from districts where name = 'Idukki'), 'Thodupuzha', 'Thodupuzha'),

  -- Kannur
  ((select id from districts where name = 'Kannur'), 'Thalassery', 'Thalassery'),
  ((select id from districts where name = 'Kannur'), 'Iritty', 'Iritty'),
  ((select id from districts where name = 'Kannur'), 'Kannur', 'Kannur'),
  ((select id from districts where name = 'Kannur'), 'Taliparamba', 'Taliparamba'),
  ((select id from districts where name = 'Kannur'), 'Payyanur', 'Payyanur'),

  -- Kasaragod
  ((select id from districts where name = 'Kasaragod'), 'Manjeshwaram', 'Uppala'),
  ((select id from districts where name = 'Kasaragod'), 'Kasaragod', 'Kasaragod'),
  ((select id from districts where name = 'Kasaragod'), 'Vellarikundu', 'Vellarikundu'),
  ((select id from districts where name = 'Kasaragod'), 'Hosdurg', 'Hosdurg'),

  -- Kollam
  ((select id from districts where name = 'Kollam'), 'Kollam', 'Paravur'),
  ((select id from districts where name = 'Kollam'), 'Karunagappally', 'Karunagappally'),
  ((select id from districts where name = 'Kollam'), 'Kunnathur', 'Sasthamkotta'),
  ((select id from districts where name = 'Kollam'), 'Kottarakkara', 'Kottarakkara'),
  ((select id from districts where name = 'Kollam'), 'Punalur', 'Punalur'),
  ((select id from districts where name = 'Kollam'), 'Pathanapuram', 'Pathanapuram'),

  -- Kottayam
  ((select id from districts where name = 'Kottayam'), 'Changanasserry', 'Changanasserry'),
  ((select id from districts where name = 'Kottayam'), 'Kanjirappally', 'Kanjirappally'),
  ((select id from districts where name = 'Kottayam'), 'Kottayam', 'Kottayam'),
  ((select id from districts where name = 'Kottayam'), 'Vaikom', 'Vaikom'),
  ((select id from districts where name = 'Kottayam'), 'Meenachil', 'Meenachil'),

  -- Kozhikode
  ((select id from districts where name = 'Kozhikode'), 'Kozhikode', 'Kozhikode'),
  ((select id from districts where name = 'Kozhikode'), 'Thamarassery', 'Thamarassery'),
  ((select id from districts where name = 'Kozhikode'), 'Koyilandy', 'Koyilandy'),
  ((select id from districts where name = 'Kozhikode'), 'Vatakara', 'Vatakara'),

  -- Malappuram
  ((select id from districts where name = 'Malappuram'), 'Nilambur', 'Nilambur'),
  ((select id from districts where name = 'Malappuram'), 'Manjeri', 'Eranad'),
  ((select id from districts where name = 'Malappuram'), 'Kondotty', 'Kondotty'),
  ((select id from districts where name = 'Malappuram'), 'Perinthalmanna', 'Perinthalmanna'),
  ((select id from districts where name = 'Malappuram'), 'Ponnani', 'Ponnani'),
  ((select id from districts where name = 'Malappuram'), 'Tirur', 'Tirur'),
  ((select id from districts where name = 'Malappuram'), 'Tirurangadi', 'Tirurangadi'),

  -- Palakkad
  ((select id from districts where name = 'Palakkad'), 'Alathur', 'Alathur'),
  ((select id from districts where name = 'Palakkad'), 'Chittur', 'Chittur'),
  ((select id from districts where name = 'Palakkad'), 'Palakkad', 'Palakkad'),
  ((select id from districts where name = 'Palakkad'), 'Pattambi', 'Pattambi'),
  ((select id from districts where name = 'Palakkad'), 'Ottappalam', 'Ottappalam'),
  ((select id from districts where name = 'Palakkad'), 'Mannarkkad', 'Mannarkkad'),
  ((select id from districts where name = 'Palakkad'), 'Attappady', 'Agali'),

  -- Pathanamthitta
  ((select id from districts where name = 'Pathanamthitta'), 'Adoor', 'Adoor'),
  ((select id from districts where name = 'Pathanamthitta'), 'Konni', 'Konni'),
  ((select id from districts where name = 'Pathanamthitta'), 'Kozhencherry', 'Pathanamthitta'),
  ((select id from districts where name = 'Pathanamthitta'), 'Ranni', 'Ranni'),
  ((select id from districts where name = 'Pathanamthitta'), 'Mallappally', 'Mallappally'),
  ((select id from districts where name = 'Pathanamthitta'), 'Thiruvalla', 'Thiruvalla'),

  -- Thiruvananthapuram
  ((select id from districts where name = 'Thiruvananthapuram'), 'Neyyattinkara', 'Neyyattinkara'),
  ((select id from districts where name = 'Thiruvananthapuram'), 'Kattakada', 'Kattakada'),
  ((select id from districts where name = 'Thiruvananthapuram'), 'Nedumangad', 'Nedumangad'),
  ((select id from districts where name = 'Thiruvananthapuram'), 'Thiruvananthapuram', 'Thiruvananthapuram'),
  ((select id from districts where name = 'Thiruvananthapuram'), 'Chirayinkeezhu', 'Attingal'),
  ((select id from districts where name = 'Thiruvananthapuram'), 'Varkala', 'Varkala'),

  -- Thrissur
  ((select id from districts where name = 'Thrissur'), 'Kodungallur', 'Kodungallur'),
  ((select id from districts where name = 'Thrissur'), 'Mukundapuram', 'Irinjalakuda'),
  ((select id from districts where name = 'Thrissur'), 'Chalakudy', 'Chalakudy'),
  ((select id from districts where name = 'Thrissur'), 'Chavakkad', 'Chavakkad'),
  ((select id from districts where name = 'Thrissur'), 'Thalapilly', 'Wadakkancheri'),
  ((select id from districts where name = 'Thrissur'), 'Thrissur', 'Thrissur'),
  ((select id from districts where name = 'Thrissur'), 'Kunnamkulam', 'Kunnamkulam'),

  -- Wayanad
  ((select id from districts where name = 'Wayanad'), 'Mananthavady', 'Mananthavady'),
  ((select id from districts where name = 'Wayanad'), 'Sultan Bathery', 'Sultan Bathery'),
  ((select id from districts where name = 'Wayanad'), 'Vythiri', 'Kalpetta'); 