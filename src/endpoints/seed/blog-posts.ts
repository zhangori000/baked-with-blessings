import type { Payload, PayloadRequest } from 'payload'

import { createParagraphsRichText } from './richText'

const firstPostParagraphs = [
  'It is a common path of life, where we work hard in school, enroll in college, get a degree, and then get a job. If someone does not want to go to school, our society usually labels them as some form of outcast. The burden of proof falls onto that person, in the same way that our criminal legal system, by default, assumes that the charged person is innocent until proven guilty. Except here, the situation is reversed. People who do not want to get a degree are guilty until proven innocent.',
  'But what even is college? In its purest technical form, getting a degree is simply doing these things. You follow some form of administrative sheet that says, "In order for you to be declared a computer science major, you must take these required courses, and these optional courses, and other combinations."',
  "And what does one course entail? It involves a professor, who is supposed to be a great teacher (highly disputable for a vast majority of schools in America), and the professor has TAs who are supposed to help you. The professor has a lesson plan, where you attend their lectures 1-5 times a week, and after several weeks, you get evaluated based on an exam, and that exam will determine your grade. And keep in mind, for majors like engineering, you're probably spending 10 hours a day just reading slides, doing problems, in order to pass a bi-weekly quiz, or a midterm, or a final. Sometimes you have group projects, sometimes you have labs.",
  "Here is another complexity. We can clearly discover the professor's credentials easily. The professor could've gone to an amazing school, had amazing grades, and amazing research. We can even see, through other sites and public opinion, whether the professor is a good teacher (in the eyes of public forums). What we cannot see, however, is why the professor got hired. The professor also had to click \"Apply,\" and I'm sure the school received hundreds upon hundreds of applications for that position. The professor probably had to go through interviews, and then the admissions committee had to have some reason for hiring that professor.",
  'And another complexity is firing that professor. The professor probably has 10 duties aside from teaching. What are the criteria for letting a professor go? What are the criteria for giving a professor feedback? What are the checks and balances such that we can satisfy the students, but also not firing professors for a lack of substantial reasons?',
  "So on face value, college seems to be amazing. You're forced to take classes of various diversities, which should all be related to your major, which in turn should help you get a job in the future. You're forced to sit down for 10 hours, studying concepts, learning, and then ultimately learning great skills, not just on the subject matter, but also time management, communication, and more.",
  "But it is also clearly known by society that there is a lot of nuance to this. What happens if the professor is truly really bad at teaching? What happens if the courses you're forced to take for the major are not that related to the future career? What happens if there is no internal career coaching such that you can have industry professionals tutor you and guide you into what classes you should take, and what midterms/concepts are actually going to be useful or not useful? What happens if you, as the student, lack the prerequisite skills to succeed under this system?",
  'All of this is a risk. Because ultimately, to get a job, you go to a networking event, or you go to a company website, you find the career openings, and you find a job description that matches your credentials, and then you click "Apply," send your resume and other materials, and then some admissions committee will read your resume and decide whether to give you an interview opportunity. And after you pass the various rounds of interview, competing against other students, then you will get a job. The end game of all this also entails a lot of risk. By signing up for this college path, you are taking on the risk of being better than others, the risk of the market going bankrupt, and probably more.',
  'What I am arguing is not that school is trash. In fact, I have not made a single definitive claim yet. You can just interpret my words as mere rambling, I am simply collecting information; I am not sure what I am going to do with it yet; these are just observations about life.',
  'School definitely incurs tons of risk for certain individuals, and we, as a society, are not doing enough to spread awareness of this reality. There are tons of people who would excel in school, and excel in this system of, do classes, listen to the professor, know how to do well on exams, know how to apply, know how to pass interviews, and boom, we are done. But there are also tons of people who are not ready for this path. But what are the alternatives? Is it just choosing the worst of two evils then?',
  "Everything in life is a business. Who owns the toilet paper industry? Who creates the stop sign metal? Who paints the houses, and who designs sidewalks and fixes potholes? Who creates straws and cups? Who is the expert manufacturer of chips bags? Who decided one day to create Icelandic Airlines? I mean, I don't know. And I'm sure most people wouldn't know. And I'm sure most people think that it is impossible to create a good business now, and that succeeding in business is as rare as going to the NBA.",
  'I think the correct cost benefit analysis for students to do is to ask themselves, "Would I rather dedicate myself to midterms, quizzes, presentations, long hours of studying ____? Or would I rather dedicate myself to the equivalent amount of long hours on making a new business, such as becoming the expert at shoveling snow, or becoming the expert at making houses beautiful, or becoming the expert at training others how to exercise, etc."',
  'Another thing to consider is that this world, sadly, is becoming more credentials based. People do not look at a major and think about professors and midterms and quizzes. So the biggest risk of not getting a degree is that you will be ignored. Sometimes, it is also important to come to terms with the status quo of the world, unless you want to be a force of extreme change.',
  'And most of the time, you can pursue both a major and have the spirit to start a business. And moreover, a business does not need to be huge at all, it could just be a local enterprise where your goal is to simply help the needs of the community.',
  'I have chosen to pursue a major AND also to pursue creating a bakery/cafe. I have historically been pretty good at school, and I think I can apply the things I learn in school to this business. I am completely new, and I am still excited to learn more. I hope the future will be bright with opportunities. I hope to open more transparent discussion about the issues of our world and to also help others along the way.',
]

const firstPostData = {
  _status: 'published' as const,
  authorName: 'Orianna Paxton',
  content: createParagraphsRichText(firstPostParagraphs),
  excerpt:
    'A personal reflection on college, credentials, risk, and choosing to build a bakery/cafe while pursuing a degree.',
  meta: {
    description:
      'Orianna Paxton reflects on college, credentials, risk, and starting a bakery/cafe in 2026.',
    title: 'Ramblings about college and starting a business in 2026',
  },
  publishedOn: '2026-04-27T12:00:00.000Z',
  slug: 'ramblings-about-college-and-starting-a-business-in-2026',
  title: 'Ramblings about college and starting a business in 2026.',
}

export const seedBlogPosts = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  const existing = await payload.find({
    collection: 'posts',
    limit: 1,
    overrideAccess: false,
    pagination: false,
    req,
    where: {
      slug: {
        equals: firstPostData.slug,
      },
    },
  })

  const existingPost = existing.docs[0]

  if (existingPost) {
    await payload.update({
      collection: 'posts',
      context: {
        disableRevalidate: true,
      },
      data: firstPostData,
      id: existingPost.id,
      overrideAccess: false,
      req,
    })

    return
  }

  await payload.create({
    collection: 'posts',
    context: {
      disableRevalidate: true,
    },
    data: firstPostData,
    overrideAccess: false,
    req,
  })
}
