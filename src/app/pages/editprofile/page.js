"use client";
import React from "react";
import { useState } from "react";
import { Combobox } from "@headlessui/react";
import ISO6391 from "iso-639-1";
import Link from "next/link";



function EditProfile() {
    const allLanguages = ISO6391.getAllNames();
    const [hobbies, setHobbies] = useState([]);
    const [custom, setCustom] = useState("");
    const [SelectedLang, setSelectedLang] = useState(null);
    const [selectedHobby, setSelectedHobby] = useState(null);
    const [hobbiesQuery, setQueryHobby] = useState("");
    const [langQuery, setQueryLang] = useState("");
    const [languages, setLanguages] = useState([]);
    const [sayings, setSayings] = useState([]);
    const [customSayings, setCustomSayings] = useState("");
    const allHobbies = [
        "Cooking",
        "Hiking",
        "Afrobeats",
        "Reading",
        "Traveling",
        "Gardening",
        "Photography",
        "Cycling",
        "Painting",
        "Gaming",
        "Dancing",
        "Writing",
        "Fishing",
        "Yoga",
        "Running",
        "Swimming",
        "Knitting",
        "Singing",
        "Volunteering",
        "Crafting"
    ];


    // Filter list
    const filteredHobbies =
        hobbiesQuery === ""
            ? allHobbies
            : allHobbies.filter((hobby) =>
                hobby.toLowerCase().includes(hobbiesQuery.toLowerCase())
            );

    // Add hobby
    const handleSelectHobby = (hobby) => {
        if (hobby && !hobbies.includes(hobby)) {
            setHobbies([...hobbies, hobby]);
        }
        setSelectedHobby(null);
        setQueryHobby("");
    };

    // Remove hobby
    const handleRemove = (hobbyToRemove) => {
        setHobbies(hobbies.filter((hobby) => hobby !== hobbyToRemove));
    };

    const filteredLangs =
        langQuery === ""
            ? allLanguages
            : allLanguages.filter((lang) =>
                lang.toLowerCase().includes(langQuery.toLowerCase())
            );

    const handleSelectLang = (language) => {
        if (language && !languages.includes(language)) {
            setLanguages([...languages, language]);
        }
        setSelectedLang(null);
        setQueryLang("");
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if (customSayings.trim() && !sayings.includes(customSayings)) {
            setSayings([...sayings, customSayings.trim()]);
            setCustomSayings("");
        }
    };

    return (
        <main className="min-h-screen bg-white flex flex-col items-center py-10 px-4 max-w-4xl mx-auto">
            <header className="w-full max-w-2xl mb-6 flex items-start">
                {/* Back Arrow that links to /userprofile */}
                <Link
                    href="/pages/userprofile"
                    className="text-gray-600 hover:text-gray-900 text-3xl"
                >
                    &larr;
                </Link>
            </header>

            {/* Profile Info */}
            <section className="flex flex-col items-center text-center mb-8">
                <div className="w-28 h-28 rounded-full bg-red-400 mb-4"></div>
                <h1 className="text-2xl font-bold text-center text-gray-800">
                    username123
                </h1>
                <select className=" p-0.5 mt-4 text-sm">
                    <option>18 - 24</option>
                    <option>25 - 34</option>
                    <option>35 - 44</option>
                    <option>45 - 54</option>
                    <option>55+</option>
                </select>
                <label className="flex flex-col text-sm text-gray-950 ">

                    <select className="mt-1 p-2 text-sm">
                        <option>Southern Africa</option>
                        <option>East Africa</option>
                        <option>West Africa</option>
                        <option>North Africa</option>
                        <option>Central Africa</option>
                    </select>
                </label>
            </section>

            {/* Edit Form */}
            <section className="w-full max-w-2xl space-y-10">

                {/* About Me */}
                <section className="w-full max-w-2xl mt-12">
                    <h2 className="text-lg font-semibold text-center mb-3">About Me</h2>
                    <textarea
                        placeholder="Write something about yourself..."
                        className="w-full border border-gray-300 rounded-md p-4 bg-gray-50"
                    // rows={4}
                    ></textarea>
                </section>


                {/* Interests & Hobbies */}
                <fieldset className="w-full max-w-2xl mt-12 text-center">
                    <legend className="text-lg font-semibold mb-4">Interests &amp; hobbies</legend>

                    {/* Selected hobbies as chips */}
                    <div className="flex flex-wrap justify-center gap-3 mb-3">
                        {hobbies.map((hobby, i) => (
                            <span
                                key={i}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-400 rounded-lg bg-white shadow-sm"
                            >
                                {hobby}
                                <button
                                    type="button"
                                    onClick={() => handleRemove(hobby)}
                                    className="text-red-500 hover:text-red-700 font-bold"
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Searchable dropdown with Add option */}
                    <Combobox value={selectedHobby} onChange={handleSelectHobby}>
                        <div className="relative w-64 mx-auto">
                            <Combobox.Input
                                className="w-full border border-gray-400 rounded-md p-2 text-sm"
                                displayValue={(hobby) => hobby || ""}
                                onChange={(e) => setQueryHobby(e.target.value)}
                                placeholder="Search or add a hobby..."
                            />

                            {(filteredHobbies.length > 0 || hobbiesQuery) && (
                                <Combobox.Options className="absolute mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg z-10">
                                    {/* Matching hobbies */}
                                    {filteredHobbies.map((hobby, i) => (
                                        <Combobox.Option
                                            key={i}
                                            value={hobby}
                                            className="cursor-pointer px-4 py-2 hover:bg-blue-100"
                                        >
                                            {hobby}
                                        </Combobox.Option>
                                    ))}

                                    {/* Add custom hobby */}
                                    {filteredHobbies.length === 0 && hobbiesQuery.trim() !== "" && (
                                        <Combobox.Option
                                            value={hobbiesQuery}
                                            className="cursor-pointer px-4 py-2 bg-green-100 text-green-800"
                                        >
                                            Add "{hobbiesQuery}"
                                        </Combobox.Option>
                                    )}
                                </Combobox.Options>
                            )}
                        </div>
                    </Combobox>
                </fieldset>

                {/* Language Preference */}
                <fieldset className="w-full max-w-2xl mt-12 text-center">
                    <legend className="text-lg font-semibold mb-4">Language preference</legend>

                    {/* Selected Languages as Chips */}
                    <div className="flex flex-wrap justify-center gap-3 mb-3">
                        {languages.map((lang, i) => (
                            <span
                                key={i}
                                className="px-4 py-2 border border-gray-400 rounded-lg bg-white shadow-sm"
                            >
                                {lang}
                            </span>
                        ))}
                    </div>

                    {/* Searchable Dropdown */}
                    <Combobox value={SelectedLang} onChange={handleSelectLang}>
                        <div className="relative w-64 mx-auto">
                            <Combobox.Input
                                className="w-full border border-gray-400 rounded-md p-2 text-sm"
                                displayValue={(lang) => lang || ""}
                                onChange={(e) => setQueryLang(e.target.value)}
                                placeholder="Search or select language..."
                            />
                            {(filteredLangs.length > 0 || langQuery) && (
                                <Combobox.Options className="absolute mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg z-10">
                                    {/* Show matching languages */}
                                    {filteredLangs.map((lang, i) => (
                                        <Combobox.Option
                                            key={i}
                                            value={lang}
                                            className="cursor-pointer px-4 py-2 hover:bg-blue-100"
                                        >
                                            {lang}
                                        </Combobox.Option>
                                    ))}

                                    {/* If nothing matches → option to add custom */}
                                    {filteredLangs.length === 0 && langQuery.trim() !== "" && (
                                        <Combobox.Option
                                            value={langQuery}
                                            className="cursor-pointer px-4 py-2 bg-green-100 text-green-800"
                                        >
                                            Add "{langQuery}"
                                        </Combobox.Option>
                                    )}
                                </Combobox.Options>
                            )}
                        </div>
                    </Combobox>
                </fieldset>

                {/* Favorites */}
                <fieldset>
                    <legend className="text-lg font-semibold mb-2 w-full max-w-2xl mt-12 text-center">Favorites</legend>
                    <textarea
                        placeholder="Tell us about your favorite local foods/music/sports etc.!"
                        className="w-full border border-gray-400 rounded-md p-4 bg-gray-50"
                        rows={3}
                    ></textarea>
                </fieldset>

                {/* Facts */}
                <fieldset>
                    <legend className="text-lg font-semibold mb-2 w-full max-w-2xl mt-12 text-center">Facts!</legend>
                    <textarea
                        placeholder="Tell us about some fun facts, holidays, in your region!"
                        className="w-full border border-gray-400 rounded-md p-4 bg-gray-50"
                        rows={3}
                    ></textarea>
                </fieldset>

                {/* Common Sayings */}
                <fieldset className="w-full max-w-2xl mt-12 text-center">
                    <legend className="text-lg font-semibold mb-4">
                        “Common sayings”{" "}
                        <span className="text-sm text-gray-500">(short phrases + meanings)</span>
                    </legend>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-3 justify-center mb-4">
                        {sayings.map((saying, i) => (
                            <span
                                key={i}
                                className="px-4 py-2 border rounded-lg bg-white shadow-sm"
                            >
                                “{saying}”
                            </span>
                        ))}
                    </div>

                    {/* Input field */}
                    <form onSubmit={handleAdd} className="flex gap-2 justify-center">
                        <input
                            type="text"
                            value={customSayings}
                            onChange={(e) => setCustomSayings(e.target.value)}
                            placeholder="Add your own saying..."
                            className="w-full border border-gray-400 rounded-md p-2 text-sm max-w-md"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                        >
                            Add
                        </button>
                    </form>
                </fieldset>
                <button
                    type="submit"
                    className="px-10 py-2 bg-blue-500 text-white rounded-md text-md hover:bg-blue-600 flex justify-center mx-auto mb-10"
                >
                    Save Changes
                </button>


            </section>
        </main>
    );
}

export default EditProfile;
